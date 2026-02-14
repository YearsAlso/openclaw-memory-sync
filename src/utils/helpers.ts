import { TFile, TFolder, normalizePath } from 'obsidian';

/**
 * 文件系统工具类
 */
export class FileSystemHelper {
	/**
	 * 确保目录存在
	 */
	static async ensureDirectory(app: any, path: string): Promise<void> {
		const normalizedPath = normalizePath(path);
		const dirPath = normalizedPath.split('/').slice(0, -1).join('/');
		
		if (dirPath) {
			await app.vault.createFolder(dirPath).catch(() => {
				// 文件夹可能已存在，忽略错误
			});
		}
	}

	/**
	 * 获取目录下的所有Markdown文件
	 */
	static getMarkdownFilesInFolder(app: any, folderPath: string): TFile[] {
		const folder = app.vault.getAbstractFileByPath(folderPath);
		
		if (!folder || !(folder instanceof TFolder)) {
			return [];
		}

		const files: TFile[] = [];
		
		const walkFolder = (folder: TFolder) => {
			for (const child of folder.children) {
				if (child instanceof TFile && child.extension === 'md') {
					files.push(child);
				} else if (child instanceof TFolder) {
					walkFolder(child);
				}
			}
		};
		
		walkFolder(folder);
		return files;
	}

	/**
	 * 检查文件是否匹配排除模式
	 */
	static isExcluded(filePath: string, excludePatterns: string[]): boolean {
		for (const pattern of excludePatterns) {
			if (pattern.startsWith('*.')) {
				// 通配符扩展名匹配
				const ext = pattern.substring(1);
				if (filePath.endsWith(ext)) {
					return true;
				}
			} else if (pattern.startsWith('.')) {
				// 隐藏文件匹配
				const parts = filePath.split('/');
				if (parts.some(part => part.startsWith('.'))) {
					return true;
				}
			} else if (pattern.endsWith('/')) {
				// 目录匹配
				if (filePath.includes(pattern)) {
					return true;
				}
			} else {
				// 精确匹配
				if (filePath === pattern) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * 获取文件统计信息
	 */
	static async getFileStats(app: any, file: TFile): Promise<{
		size: number;
		lines: number;
		words: number;
		created: Date;
		modified: Date;
	}> {
		const stats = app.vault.getFileStats(file);
		const content = await app.vault.read(file);
		
		return {
			size: file.stat.size,
			lines: content.split('\n').length,
			words: content.split(/\s+/).length,
			created: new Date(stats.ctime),
			modified: new Date(stats.mtime)
		};
	}
}

/**
 * 日期时间工具类
 */
export class DateTimeHelper {
	/**
	 * 格式化时间为相对时间
	 */
	static formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);
		
		if (diffSec < 60) {
			return `${diffSec}秒前`;
		} else if (diffMin < 60) {
			return `${diffMin}分钟前`;
		} else if (diffHour < 24) {
			return `${diffHour}小时前`;
		} else if (diffDay < 7) {
			return `${diffDay}天前`;
		} else {
			return date.toLocaleDateString();
		}
	}

	/**
	 * 格式化日期时间
	 */
	static formatDateTime(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: format === 'short' ? 'numeric' : 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: format === 'long' ? '2-digit' : undefined
		};
		
		return date.toLocaleString(undefined, options);
	}

	/**
	 * 格式化文件大小
	 */
	static formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * 计算时间差
	 */
	static timeDifference(start: Date, end: Date): {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		milliseconds: number;
	} {
		const diffMs = end.getTime() - start.getTime();
		
		return {
			days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
			hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
			milliseconds: diffMs % 1000
		};
	}
}

/**
 * 字符串工具类
 */
export class StringHelper {
	/**
	 * 截断字符串并添加省略号
	 */
	static truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
		if (text.length <= maxLength) {
			return text;
		}
		
		return text.substring(0, maxLength - ellipsis.length) + ellipsis;
	}

	/**
	 * 安全地解析JSON
	 */
	static safeParseJSON<T>(jsonString: string, defaultValue: T): T {
		try {
			return JSON.parse(jsonString) as T;
		} catch {
			return defaultValue;
		}
	}

	/**
	 * 生成随机ID
	 */
	static generateId(length: number = 8): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		
		return result;
	}

	/**
	 * 清理文件名中的非法字符
	 */
	static sanitizeFilename(filename: string): string {
		return filename.replace(/[<>:"/\\|?*]/g, '_');
	}

	/**
	 * 提取文件扩展名
	 */
	static getFileExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
	}
}

/**
 * 数组工具类
 */
export class ArrayHelper {
	/**
	 * 数组去重
	 */
	static unique<T>(array: T[]): T[] {
		return [...new Set(array)];
	}

	/**
	 * 数组分组
	 */
	static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
		return array.reduce((groups, item) => {
			const key = keyFn(item);
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
			return groups;
		}, {} as Record<string, T[]>);
	}

	/**
	 * 数组分页
	 */
	static paginate<T>(array: T[], page: number, pageSize: number): T[] {
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		return array.slice(start, end);
	}

	/**
	 * 数组排序
	 */
	static sortBy<T>(array: T[], keyFn: (item: T) => any, ascending: boolean = true): T[] {
		return [...array].sort((a, b) => {
			const aValue = keyFn(a);
			const bValue = keyFn(b);
			
			if (aValue < bValue) return ascending ? -1 : 1;
			if (aValue > bValue) return ascending ? 1 : -1;
			return 0;
		});
	}
}

/**
 * 对象工具类
 */
export class ObjectHelper {
	/**
	 * 深度合并对象
	 */
	static deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
		const result = { ...target };
		
		for (const key in source) {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
				result[key] = this.deepMerge(result[key] || {}, source[key] as any);
			} else {
				result[key] = source[key] as any;
			}
		}
		
		return result;
	}

	/**
	 * 安全获取嵌套属性
	 */
	static getNested<T>(obj: any, path: string, defaultValue: T): T {
		const keys = path.split('.');
		let current = obj;
		
		for (const key of keys) {
			if (current && typeof current === 'object' && key in current) {
				current = current[key];
			} else {
				return defaultValue;
			}
		}
		
		return current as T;
	}

	/**
	 * 过滤对象属性
	 */
	static filter<T extends Record<string, any>>(obj: T, predicate: (key: string, value: any) => boolean): Partial<T> {
		const result: Partial<T> = {};
		
		for (const key in obj) {
			if (predicate(key, obj[key])) {
				result[key] = obj[key];
			}
		}
		
		return result;
	}
}

/**
 * 验证工具类
 */
export class ValidationHelper {
	/**
	 * 验证URL
	 */
	static isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * 验证电子邮件
	 */
	static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * 验证端口号
	 */
	static isValidPort(port: number): boolean {
		return port > 0 && port <= 65535;
	}

	/**
	 * 验证文件名
	 */
	static isValidFilename(filename: string): boolean {
		const invalidChars = /[<>:"/\\|?*]/;
		return !invalidChars.test(filename);
	}
}

/**
 * 错误处理工具类
 */
export class ErrorHelper {
	/**
	 * 创建标准化的错误对象
	 */
	static createError(
		message: string,
		code?: string,
		details?: any
	): {
		message: string;
		code?: string;
		details?: any;
		timestamp: Date;
	} {
		return {
			message,
			code,
			details,
			timestamp: new Date()
		};
	}

	/**
	 * 检查错误是否可重试
	 */
	static isRetryableError(error: any): boolean {
		const retryableCodes = [
			'ETIMEDOUT',
			'ECONNRESET',
			'ECONNREFUSED',
			'EAI_AGAIN',
			'ENOTFOUND'
		];
		
		return retryableCodes.includes(error.code) || 
			   error.message?.includes('timeout') ||
			   error.message?.includes('connection');
	}

	/**
	 * 获取错误堆栈的简洁版本
	 */
	static getCleanStackTrace(error: Error): string {
		const stack = error.stack || '';
		return stack.split('\n')
			.filter(line => !line.includes('node_modules'))
			.join('\n');
	}
}