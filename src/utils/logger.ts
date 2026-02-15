export interface OpenClawMemorySyncSettings {
	apiUrl: string;
	apiPort: number;
	syncInterval: number;
	autoSync: boolean;
	conflictStrategy: 'timestamp' | 'local' | 'remote' | 'ask';
	excludePatterns: string[];
	enableWebSocket: boolean;
	logLevel: 'debug' | 'info' | 'warn' | 'error';
	targetFolder: string;
}

export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error'
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	source?: string;
	data?: any;
}

export class Logger {
	private logs: LogEntry[] = [];
	private maxLogs: number = 1000;
	private listeners: ((entry: LogEntry) => void)[] = [];

	constructor(private settings: OpenClawMemorySyncSettings) {}

	debug(message: string, source?: string, data?: any): void {
		this.log(LogLevel.DEBUG, message, source, data);
	}

	info(message: string, source?: string, data?: any): void {
		this.log(LogLevel.INFO, message, source, data);
	}

	warn(message: string, source?: string, data?: any): void {
		this.log(LogLevel.WARN, message, source, data);
	}

	error(message: string, source?: string, data?: any): void {
		this.log(LogLevel.ERROR, message, source, data);
	}

	private log(level: LogLevel, message: string, source?: string, data?: any): void {
		// 检查日志级别是否应该记录
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			message,
			source,
			data
		};

		// 添加到日志数组
		this.logs.push(entry);

		// 限制日志数量
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// 输出到控制台
		this.consoleLog(entry);

		// 通知监听器
		this.notifyListeners(entry);
	}

	private shouldLog(level: LogLevel): boolean {
		const levelOrder = {
			[LogLevel.DEBUG]: 0,
			[LogLevel.INFO]: 1,
			[LogLevel.WARN]: 2,
			[LogLevel.ERROR]: 3
		};

		const currentLevel = levelOrder[this.settings.logLevel];
		const messageLevel = levelOrder[level];

		return messageLevel >= currentLevel;
	}

	private consoleLog(entry: LogEntry): void {
		const timestamp = entry.timestamp.toISOString().split('T')[1].split('.')[0];
		const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
		const source = entry.source ? `[${entry.source}]` : '';
		const message = `${prefix}${source} ${entry.message}`;

		switch (entry.level) {
			case LogLevel.DEBUG:
				console.debug(message, entry.data || '');
				break;
			case LogLevel.INFO:
				console.info(message, entry.data || '');
				break;
			case LogLevel.WARN:
				console.warn(message, entry.data || '');
				break;
			case LogLevel.ERROR:
				console.error(message, entry.data || '');
				break;
		}
	}

	private notifyListeners(entry: LogEntry): void {
		this.listeners.forEach(listener => {
			try {
				listener(entry);
			} catch (error) {
				console.error('日志监听器错误:', error);
			}
		});
	}

	// 公共方法
	getLogs(level?: LogLevel, limit?: number): LogEntry[] {
		let filteredLogs = this.logs;

		if (level) {
			filteredLogs = filteredLogs.filter(log => log.level === level);
		}

		if (limit && limit > 0) {
			filteredLogs = filteredLogs.slice(-limit);
		}

		return [...filteredLogs];
	}

	clearLogs(): void {
		this.logs = [];
	}

	onLog(listener: (entry: LogEntry) => void): void {
		this.listeners.push(listener);
	}

	offLog(listener: (entry: LogEntry) => void): void {
		const index = this.listeners.indexOf(listener);
		if (index > -1) {
			this.listeners.splice(index, 1);
		}
	}

	getStats(): {
		total: number;
		byLevel: Record<LogLevel, number>;
		bySource: Record<string, number>;
		oldest: Date | null;
		newest: Date | null;
	} {
		const stats = {
			total: this.logs.length,
			byLevel: {
				[LogLevel.DEBUG]: 0,
				[LogLevel.INFO]: 0,
				[LogLevel.WARN]: 0,
				[LogLevel.ERROR]: 0
			},
			bySource: {} as Record<string, number>,
			oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
			newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
		};

		for (const log of this.logs) {
			(stats.byLevel as any)[log.level]++;

			if (log.source) {
				stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
			}
		}

		return stats;
	}

	exportLogs(format: 'json' | 'text' = 'json'): string {
		if (format === 'json') {
			return JSON.stringify(this.logs, null, 2);
		} else {
			return this.logs.map(log => {
				const timestamp = log.timestamp.toISOString();
				const level = log.level.toUpperCase().padEnd(5);
				const source = log.source ? ` [${log.source}]` : '';
				return `${timestamp} ${level}${source} ${log.message}`;
			}).join('\n');
		}
	}

	// 工具方法
	static formatError(error: any): string {
		if (error instanceof Error) {
			return `${error.name}: ${error.message}\n${error.stack || ''}`;
		} else if (typeof error === 'string') {
			return error;
		} else {
			try {
				return JSON.stringify(error);
			} catch {
				return String(error);
			}
		}
	}

	/**
	 * 性能监控：记录方法执行时间
	 * @param method 要监控的方法
	 * @param methodName 方法名称（用于日志）
	 * @returns 包装后的方法
	 */
	static monitorPerformance<T extends (...args: any[]) => any>(
		method: T,
		methodName: string,
		logger: Logger
	): T {
		return ((...args: Parameters<T>): ReturnType<T> => {
			const startTime = performance.now();
			
			try {
				const result = method(...args);
				
				// 如果是Promise，监控异步执行时间
				if (result instanceof Promise) {
					return result.then(asyncResult => {
						const endTime = performance.now();
						const duration = endTime - startTime;
						logger.debug(`Method ${methodName} completed in ${duration.toFixed(2)}ms`, 'performance');
						return asyncResult;
					}).catch(error => {
						const endTime = performance.now();
						const duration = endTime - startTime;
						logger.error(`Method ${methodName} failed after ${duration.toFixed(2)}ms: ${this.formatError(error)}`, 'performance');
						throw error;
					}) as ReturnType<T>;
				}
				
				// 同步方法
				const endTime = performance.now();
				const duration = endTime - startTime;
				logger.debug(`Method ${methodName} completed in ${duration.toFixed(2)}ms`, 'performance');
				return result;
				
			} catch (error) {
				const endTime = performance.now();
				const duration = endTime - startTime;
				logger.error(`Method ${methodName} failed after ${duration.toFixed(2)}ms: ${this.formatError(error)}`, 'performance');
				throw error;
			}
		}) as T;
	}

	static createContextLogger(source: string, settings: OpenClawMemorySyncSettings): Logger {
		const logger = new Logger(settings);
		
		return {
			debug: (message: string, data?: any) => logger.debug(message, source, data),
			info: (message: string, data?: any) => logger.info(message, source, data),
			warn: (message: string, data?: any) => logger.warn(message, source, data),
			error: (message: string, data?: any) => logger.error(message, source, data),
			getLogs: (level?: LogLevel, limit?: number) => logger.getLogs(level, limit),
			clearLogs: () => logger.clearLogs(),
			onLog: (listener: (entry: LogEntry) => void) => logger.onLog(listener),
			offLog: (listener: (entry: LogEntry) => void) => logger.offLog(listener),
			getStats: () => logger.getStats(),
			exportLogs: (format?: 'json' | 'text') => logger.exportLogs(format)
		} as Logger;
	}
}