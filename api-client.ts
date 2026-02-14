import { Notice } from 'obsidian';
import { OpenClawMemorySyncSettings } from './main';

export interface MemoryFile {
	name: string;
	path: string;
	size: number;
	created: Date;
	modified: Date;
	lines: number;
	preview: string;
}

export interface FileContent {
	filename: string;
	content: string;
	stats: {
		size: number;
		created: Date;
		modified: Date;
	};
}

export interface SearchResult {
	filename: string;
	matches: number;
	preview: string[];
	content: string;
}

export interface MemoryStats {
	totalFiles: number;
	totalSize: number;
	totalLines: number;
	averageSize: number;
	averageLines: number;
	byMonth: Record<string, number>;
	byWeekday: Record<string, number>;
	lastUpdated: Date;
}

export interface WebSocketMessage {
	type: string;
	event?: string;
	data?: any;
	timestamp: string;
}

export class OpenClawAPIClient {
	private baseUrl: string;
	private wsUrl: string;
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private messageHandlers: Map<string, Function[]> = new Map();

	constructor(private settings: OpenClawMemorySyncSettings) {
		this.baseUrl = `http://${settings.apiUrl}:${settings.apiPort}`;
		this.wsUrl = `ws://${settings.apiUrl}:8766`;
	}

	async connect(): Promise<void> {
		// 测试HTTP连接
		await this.testConnection();
		
		// 连接WebSocket
		if (this.settings.enableWebSocket) {
			await this.connectWebSocket();
		}
	}

	async disconnect(): Promise<void> {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	async testConnection(): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/health`);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			if (data.status !== 'ok') {
				throw new Error('API服务器状态异常');
			}
			
			console.log('OpenClaw API连接测试成功');
		} catch (error) {
			console.error('OpenClaw API连接测试失败:', error);
			throw new Error(`连接测试失败: ${error.message}`);
		}
	}

	async getMemoryInfo(): Promise<any> {
		const response = await this.fetchWithRetry(`${this.baseUrl}/api/memory/info`);
		return await response.json();
	}

	async getFiles(): Promise<MemoryFile[]> {
		const response = await this.fetchWithRetry(`${this.baseUrl}/api/memory/files`);
		const data = await response.json();
		return data.files.map((file: any) => ({
			...file,
			created: new Date(file.created),
			modified: new Date(file.modified)
		}));
	}

	async getFile(filename: string): Promise<FileContent> {
		const response = await this.fetchWithRetry(`${this.baseUrl}/api/memory/files/${filename}`);
		const data = await response.json();
		return {
			...data,
			stats: {
				...data.stats,
				created: new Date(data.stats.created),
				modified: new Date(data.stats.modified)
			}
		};
	}

	async saveFile(filename: string, content: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/api/memory/files/${filename}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain'
			},
			body: content
		});
		
		if (!response.ok) {
			throw new Error(`保存文件失败: ${response.statusText}`);
		}
	}

	async deleteFile(filename: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/api/memory/files/${filename}`, {
			method: 'DELETE'
		});
		
		if (!response.ok) {
			throw new Error(`删除文件失败: ${response.statusText}`);
		}
	}

	async search(query: string): Promise<SearchResult[]> {
		const response = await this.fetchWithRetry(`${this.baseUrl}/api/memory/search?q=${encodeURIComponent(query)}`);
		const data = await response.json();
		return data.results;
	}

	async getStats(): Promise<MemoryStats> {
		const response = await this.fetchWithRetry(`${this.baseUrl}/api/memory/stats`);
		const data = await response.json();
		return {
			...data,
			lastUpdated: new Date(data.lastUpdated)
		};
	}

	private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
		for (let i = 0; i < retries; i++) {
			try {
				const response = await fetch(url, options);
				if (response.ok) {
					return response;
				}
				
				if (i < retries - 1) {
					await this.sleep(1000 * (i + 1));
				}
			} catch (error) {
				if (i < retries - 1) {
					await this.sleep(1000 * (i + 1));
				} else {
					throw error;
				}
			}
		}
		
		throw new Error(`请求失败: ${url}`);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// WebSocket相关方法
	private async connectWebSocket(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.wsUrl);
				
				this.ws.onopen = () => {
					console.log('OpenClaw WebSocket连接成功');
					this.reconnectAttempts = 0;
					
					// 发送订阅消息
					this.ws?.send(JSON.stringify({
						type: 'subscribe',
						channels: ['file_changes']
					}));
					
					resolve();
				};
				
				this.ws.onmessage = (event) => {
					try {
						const message: WebSocketMessage = JSON.parse(event.data);
						this.handleWebSocketMessage(message);
					} catch (error) {
						console.error('WebSocket消息解析失败:', error);
					}
				};
				
				this.ws.onclose = () => {
					console.log('OpenClaw WebSocket连接关闭');
					this.ws = null;
					
					// 尝试重连
					if (this.reconnectAttempts < this.maxReconnectAttempts) {
						this.reconnectAttempts++;
						const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
						
						console.log(`WebSocket将在 ${delay}ms 后重连 (尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
						
						setTimeout(() => {
							this.connectWebSocket().catch(console.error);
						}, delay);
					}
				};
				
				this.ws.onerror = (error) => {
					console.error('OpenClaw WebSocket错误:', error);
					reject(error);
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	private handleWebSocketMessage(message: WebSocketMessage): void {
		switch (message.type) {
			case 'welcome':
				console.log('WebSocket欢迎消息:', message.message);
				break;
				
			case 'notification':
				this.emit(message.event || 'unknown', message.data);
				break;
				
			case 'pong':
				// 心跳响应，不做处理
				break;
				
			default:
				console.log('未知的WebSocket消息类型:', message.type);
		}
	}

	// 事件系统
	on(event: string, handler: Function): void {
		if (!this.messageHandlers.has(event)) {
			this.messageHandlers.set(event, []);
		}
		this.messageHandlers.get(event)?.push(handler);
	}

	off(event: string, handler: Function): void {
		const handlers = this.messageHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	private emit(event: string, data: any): void {
		const handlers = this.messageHandlers.get(event);
		if (handlers) {
			handlers.forEach(handler => {
				try {
					handler(data);
				} catch (error) {
					console.error(`事件处理器错误 (${event}):`, error);
				}
			});
		}
	}

	// 工具方法
	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	getConnectionStatus(): string {
		if (!this.ws) {
			return 'disconnected';
		}
		
		switch (this.ws.readyState) {
			case WebSocket.CONNECTING:
				return 'connecting';
			case WebSocket.OPEN:
				return 'connected';
			case WebSocket.CLOSING:
				return 'closing';
			case WebSocket.CLOSED:
				return 'closed';
			default:
				return 'unknown';
		}
	}
}