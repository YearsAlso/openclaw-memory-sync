import { TFile, TFolder, normalizePath } from 'obsidian';

/**
 * 文件系统相关工具函数
 */
export class FileSystemHelper {
	/**
	 * 确保目录存在
	 */
	static async ensureDirectory(app: any, path: string): Promise<void> {
		const normalizedPath = normalizePath(path);
		
		// 如果路径为空，直接返回
		if (!normalizedPath || normalizedPath === '.') {
			return;
		}
		
		// 检查目录是否存在
		const folder = app.vault.getAbstractFileByPath(normalizedPath);
		if (folder instanceof TFolder) {
			return;
		}
		
		// 如果存在同名文件，抛出错误
		if (folder instanceof TFile) {
			throw new Error(`路径 ${normalizedPath} 已存在但不是文件夹`);
		}
		
		// 创建目录
		await app.vault.createFolder(normalizedPath);
	}

	/**
	 * 获取文件扩展名
	 */
	static getFileExtension(filename: string): string {
		const lastDotIndex = filename.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return '';
		}
		return filename.substring(lastDotIndex + 1).toLowerCase();
	}

	/**
	 * 检查文件是否匹配排除模式
	 */
	static isFileExcluded(filePath: string, excludePatterns: string[]): boolean {
		for (const pattern of excludePatterns) {
			if (this.matchesPattern(filePath, pattern)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 检查文件路径是否匹配模式
	 */
	private static matchesPattern(filePath: string, pattern: string): boolean {
		// 清理模式
		pattern = pattern.trim();
		if (!pattern) {
			return false;
		}

		// 通配符扩展名匹配 (如 *.tmp)
		if (pattern.startsWith('*.')) {
			const ext = pattern.substring(1); // 包括点号
			return filePath.endsWith(ext);
		}

		// 隐藏文件匹配 (如 .*)
		if (pattern.startsWith('.')) {
			const parts = filePath.split('/');
			return parts.some(part => part.startsWith('.'));
		}

		// 目录匹配 (如 node_modules/)
		if (pattern.endsWith('/')) {
			return filePath.includes(pattern);
		}

		// 精确匹配
		return filePath === pattern;
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
	 * 获取相对时间描述
	 */
	static getRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffSeconds < 60) {
			return '刚刚';
		} else if (diffMinutes < 60) {
			return `${diffMinutes}分钟前`;
		} else if (diffHours < 24) {
			return `${diffHours}小时前`;
		} else if (diffDays < 7) {
			return `${diffDays}天前`;
		} else {
			return date.toLocaleDateString();
		}
	}
}

/**
 * 字符串处理工具函数
 */
export class StringHelper {
	/**
	 * 安全截断字符串
	 */
	static truncate(text: string, maxLength: number, suffix: string = '...'): string {
		if (text.length <= maxLength) {
			return text;
		}
		
		return text.substring(0, maxLength - suffix.length) + suffix;
	}

	/**
	 * 生成唯一ID
	 */
	static generateId(length: number = 8): string {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		
		return result;
	}

	/**
	 * 清理文件名
	 */
	static sanitizeFilename(filename: string): string {
		// 移除非法字符
		return filename.replace(/[<>:"/\\|?*]/g, '_');
	}

	/**
	 * 高亮搜索关键词
	 */
	static highlightSearch(text: string, query: string): string {
		if (!query.trim()) {
			return text;
		}
		
		const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
		return text.replace(regex, '<mark>$1</mark>');
	}

	/**
	 * 转义正则表达式特殊字符
	 */
	private static escapeRegExp(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

/**
 * 日期时间工具函数
 */
export class DateTimeHelper {
	/**
	 * 格式化日期时间
	 */
	static formatDateTime(date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
		const map: Record<string, any> = {
			yyyy: date.getFullYear(),
			MM: String(date.getMonth() + 1).padStart(2, '0'),
			dd: String(date.getDate()).padStart(2, '0'),
			HH: String(date.getHours()).padStart(2, '0'),
			mm: String(date.getMinutes()).padStart(2, '0'),
			ss: String(date.getSeconds()).padStart(2, '0')
		};
		
		return format.replace(/yyyy|MM|dd|HH|mm|ss/g, matched => map[matched]);
	}

	/**
	 * 计算时间差
	 */
	static getTimeDifference(start: Date, end: Date): {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		milliseconds: number;
	} {
		const diffMs = Math.abs(end.getTime() - start.getTime());
		
		return {
			days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
			hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
			milliseconds: diffMs % 1000
		};
	}

	/**
	 * 格式化时间差
	 */
	static formatTimeDifference(start: Date, end: Date): string {
		const diff = this.getTimeDifference(start, end);
		
		if (diff.days > 0) {
			return `${diff.days}天 ${diff.hours}小时`;
		} else if (diff.hours > 0) {
			return `${diff.hours}小时 ${diff.minutes}分钟`;
		} else if (diff.minutes > 0) {
			return `${diff.minutes}分钟 ${diff.seconds}秒`;
		} else {
			return `${diff.seconds}秒`;
		}
	}
}

/**
 * 数组和对象工具函数
 */
export class CollectionHelper {
	/**
	 * 深拷贝对象
	 */
	static deepClone<T>(obj: T): T {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}
		
		if (obj instanceof Date) {
			return new Date(obj.getTime()) as any;
		}
		
		if (obj instanceof Array) {
			return obj.map(item => this.deepClone(item)) as any;
		}
		
		if (typeof obj === 'object') {
			const cloned: any = {};
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					cloned[key] = this.deepClone(obj[key]);
				}
			}
			return cloned;
		}
		
		return obj;
	}

	/**
	 * 数组去重
	 */
	static unique<T>(array: T[], key?: keyof T): T[] {
		if (!key) {
			return [...new Set(array)];
		}
		
		const seen = new Set();
		return array.filter(item => {
			const value = item[key];
			if (seen.has(value)) {
				return false;
			}
			seen.add(value);
			return true;
		});
	}

	/**
	 * 分组数组
	 */
	static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
		return array.reduce((groups, item) => {
			const groupKey = String(item[key]);
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(item);
			return groups;
		}, {} as Record<string, T[]>);
	}

	/**
	 * 分页数组
	 */
	static paginate<T>(array: T[], page: number, pageSize: number): T[] {
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		return array.slice(start, end);
	}
}

/**
 * 错误处理工具函数
 */
export class ErrorHelper {
	/**
	 * 创建用户友好的错误消息
	 */
	static getUserFriendlyError(error: any): string {
		if (typeof error === 'string') {
			return error;
		}
		
		if (error instanceof Error) {
			// 网络错误
			if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
				return '网络连接失败，请检查网络设置';
			}
			
			// 超时错误
			if (error.message.includes('timeout') || error.message.includes('Timeout')) {
				return '请求超时，请稍后重试';
			}
			
			// 权限错误
			if (error.message.includes('permission') || error.message.includes('access denied')) {
				return '权限不足，请检查访问权限';
			}
			
			// 其他错误
			return error.message;
		}
		
		// 未知错误
		return '发生未知错误';
	}

	/**
	 * 重试函数
	 */
	static async retry<T>(
		fn: () => Promise<T>,
		maxRetries: number = 3,
		delayMs: number = 1000
	): Promise<T> {
		let lastError: any;
		
		for (let i = 0; i < maxRetries; i++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;
				
				// 如果不是最后一次重试，等待一段时间
				if (i < maxRetries - 1) {
					await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
				}
			}
		}
		
		throw lastError;
	}
}