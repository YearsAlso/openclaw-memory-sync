export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: Date;
	context?: string;
	data?: any;
}

export interface LoggerOptions {
	level: LogLevel;
	maxEntries: number;
	enableConsole: boolean;
	enableFile: boolean;
	filePath?: string;
}

const DEFAULT_OPTIONS: LoggerOptions = {
	level: 'info',
	maxEntries: 1000,
	enableConsole: true,
	enableFile: false
};

export class Logger {
	private entries: LogEntry[] = [];
	private options: LoggerOptions;

	constructor(options?: Partial<LoggerOptions>) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	debug(message: string, context?: string, data?: any): void {
		this.log('debug', message, context, data);
	}

	info(message: string, context?: string, data?: any): void {
		this.log('info', message, context, data);
	}

	warn(message: string, context?: string, data?: any): void {
		this.log('warn', message, context, data);
	}

	error(message: string, context?: string, data?: any): void {
		this.log('error', message, context, data);
	}

	private log(level: LogLevel, message: string, context?: string, data?: any): void {
		// 检查日志级别
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: LogEntry = {
			level,
			message,
			timestamp: new Date(),
			context,
			data
		};

		// 添加到内存
		this.entries.push(entry);
		
		// 限制条目数量
		if (this.entries.length > this.options.maxEntries) {
			this.entries = this.entries.slice(-this.options.maxEntries);
		}

		// 输出到控制台
		if (this.options.enableConsole) {
			this.logToConsole(entry);
		}

		// 输出到文件
		if (this.options.enableFile && this.options.filePath) {
			this.logToFile(entry).catch(console.error);
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3
		};
		
		return levels[level] >= levels[this.options.level];
	}

	private logToConsole(entry: LogEntry): void {
		const timestamp = entry.timestamp.toISOString().split('T')[1].split('.')[0];
		const context = entry.context ? `[${entry.context}]` : '';
		const levelIcon = this.getLevelIcon(entry.level);
		const levelColor = this.getLevelColor(entry.level);
		
		const style = `color: ${levelColor}; font-weight: bold;`;
		const message = `%c${levelIcon} [${timestamp}]${context} ${entry.message}`;
		
		console.log(message, style);
		
		if (entry.data) {
			console.log('Data:', entry.data);
		}
	}

	private async logToFile(entry: LogEntry): Promise<void> {
		// 在实际实现中，这里应该写入文件
		// 由于Obsidian插件的限制，文件写入需要特殊处理
		// 暂时留空，后续实现
	}

	private getLevelIcon(level: LogLevel): string {
		switch (level) {
			case 'debug': return '🐛';
			case 'info': return 'ℹ️';
			case 'warn': return '⚠️';
			case 'error': return '❌';
			default: return '📝';
		}
	}

	private getLevelColor(level: LogLevel): string {
		switch (level) {
			case 'debug': return '#888';
			case 'info': return '#2196F3';
			case 'warn': return '#FF9800';
			case 'error': return '#F44336';
			default: return '#000';
		}
	}

	// 查询方法
	getEntries(level?: LogLevel, limit?: number): LogEntry[] {
		let entries = this.entries;
		
		if (level) {
			entries = entries.filter(entry => entry.level === level);
		}
		
		if (limit) {
			entries = entries.slice(-limit);
		}
		
		return entries;
	}

	getEntriesByContext(context: string, limit?: number): LogEntry[] {
		let entries = this.entries.filter(entry => entry.context === context);
		
		if (limit) {
			entries = entries.slice(-limit);
		}
		
		return entries;
	}

	getEntriesSince(timestamp: Date): LogEntry[] {
		return this.entries.filter(entry => entry.timestamp >= timestamp);
	}

	// 统计方法
	getStats(): {
		total: number;
		byLevel: Record<LogLevel, number>;
		byContext: Record<string, number>;
	} {
		const stats = {
			total: this.entries.length,
			byLevel: {
				debug: 0,
				info: 0,
				warn: 0,
				error: 0
			},
			byContext: {} as Record<string, number>
		};
		
		for (const entry of this.entries) {
			stats.byLevel[entry.level]++;
			
			if (entry.context) {
				stats.byContext[entry.context] = (stats.byContext[entry.context] || 0) + 1;
			}
		}
		
		return stats;
	}

	// 清理方法
	clear(): void {
		this.entries = [];
	}

	clearByLevel(level: LogLevel): void {
		this.entries = this.entries.filter(entry => entry.level !== level);
	}

	clearByContext(context: string): void {
		this.entries = this.entries.filter(entry => entry.context !== context);
	}

	clearBefore(timestamp: Date): void {
		this.entries = this.entries.filter(entry => entry.timestamp >= timestamp);
	}

	// 配置方法
	setLevel(level: LogLevel): void {
		this.options.level = level;
	}

	getLevel(): LogLevel {
		return this.options.level;
	}

	setMaxEntries(maxEntries: number): void {
		this.options.maxEntries = maxEntries;
		
		// 立即应用限制
		if (this.entries.length > maxEntries) {
			this.entries = this.entries.slice(-maxEntries);
		}
	}

	enableConsole(enabled: boolean): void {
		this.options.enableConsole = enabled;
	}

	enableFile(enabled: boolean, filePath?: string): void {
		this.options.enableFile = enabled;
		if (filePath) {
			this.options.filePath = filePath;
		}
	}

	// 导出方法
	exportAsText(): string {
		return this.entries.map(entry => {
			const timestamp = entry.timestamp.toISOString();
			const context = entry.context ? ` [${entry.context}]` : '';
			const data = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
			return `${timestamp} ${entry.level.toUpperCase()}${context}: ${entry.message}${data}`;
		}).join('\n');
	}

	exportAsJSON(): string {
		return JSON.stringify(this.entries, null, 2);
	}
}

// 全局日志实例
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
	if (!globalLogger) {
		globalLogger = new Logger();
	}
	return globalLogger;
}

export function setGlobalLogger(logger: Logger): void {
	globalLogger = logger;
}

// 快捷方法
export function debug(message: string, context?: string, data?: any): void {
	getLogger().debug(message, context, data);
}

export function info(message: string, context?: string, data?: any): void {
	getLogger().info(message, context, data);
}

export function warn(message: string, context?: string, data?: any): void {
	getLogger().warn(message, context, data);
}

export function error(message: string, context?: string, data?: any): void {
	getLogger().error(message, context, data);
}