import { App, ItemView, WorkspaceLeaf, TFile, TFolder, Notice } from 'obsidian';
import { OpenClawAPIClient, MemoryFile } from '../../api-client';

// 使用唯一视图类型名称，避免冲突
export const MEMORY_VIEW_TYPE_FIXED = 'openclaw-memory-view-fixed-' + Date.now();

export class MemoryViewFixed extends ItemView {
	private apiClient: OpenClawAPIClient;
	private files: MemoryFile[] = [];
	private filteredFiles: MemoryFile[] = [];
	private searchQuery: string = '';
	private sortBy: 'name' | 'size' | 'modified' | 'created' = 'modified';
	private sortOrder: 'asc' | 'desc' = 'desc';
	private isLoading: boolean = false;
	private lastRefresh: Date | null = null;
	private statusEl: HTMLElement;

	constructor(leaf: WorkspaceLeaf, apiClient: OpenClawAPIClient) {
		super(leaf);
		this.apiClient = apiClient;
	}

	getViewType(): string {
		return MEMORY_VIEW_TYPE_FIXED;
	}

	getDisplayText(): string {
		return 'OpenClaw记忆库';
	}

	getIcon(): string {
		return 'brain';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();

		// 创建主容器
		const mainContainer = container.createDiv({ cls: 'openclaw-memory-view' });

		// 创建标题栏
		const header = mainContainer.createDiv({ cls: 'openclaw-memory-header' });
		header.createEl('h2', { text: 'OpenClaw记忆库' });

		// 创建状态栏
		this.statusEl = mainContainer.createDiv({ cls: 'openclaw-status' });
		this.statusEl.setText('正在加载...');

		// 加载文件
		await this.loadFiles();
	}

	async loadFiles(): Promise<void> {
		try {
			this.isLoading = true;
			this.statusEl.setText('正在加载记忆文件...');
			
			// 这里可以调用 API 获取文件列表
			// this.files = await this.apiClient.getMemoryFiles();
			
			// 模拟数据
			this.files = [
				{ name: 'MEMORY.md', size: 1024, modified: new Date(), created: new Date() },
				{ name: 'memory/2024-01-01.md', size: 512, modified: new Date(), created: new Date() }
			];
			
			this.filteredFiles = [...this.files];
			this.renderFileList();
			this.statusEl.setText(`已加载 ${this.files.length} 个文件`);
			this.lastRefresh = new Date();
			
		} catch (error) {
			console.error('加载文件失败:', error);
			this.statusEl.setText('加载失败: ' + error.message);
		} finally {
			this.isLoading = false;
		}
	}

	renderFileList(): void {
		const container = this.containerEl.children[1];
		const fileListContainer = container.createDiv({ cls: 'openclaw-file-list' });
		
		if (this.filteredFiles.length === 0) {
			fileListContainer.createEl('p', { text: '没有找到文件' });
			return;
		}
		
		// 排序文件
		const sortedFiles = [...this.filteredFiles].sort((a, b) => {
			let comparison = 0;
			switch (this.sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'size':
					comparison = a.size - b.size;
					break;
				case 'modified':
					comparison = a.modified.getTime() - b.modified.getTime();
					break;
				case 'created':
					comparison = a.created.getTime() - b.created.getTime();
					break;
			}
			return this.sortOrder === 'asc' ? comparison : -comparison;
		});
		
		// 渲染文件列表
		sortedFiles.forEach(file => {
			const fileItem = fileListContainer.createDiv({ cls: 'openclaw-file-item' });
			fileItem.createEl('div', { 
				cls: 'file-name',
				text: file.name 
			});
			fileItem.createEl('div', { 
				cls: 'file-size',
				text: this.formatFileSize(file.size) 
			});
			fileItem.createEl('div', { 
				cls: 'file-modified',
				text: file.modified.toLocaleDateString() 
			});
		});
	}

	formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	static open(app: App, apiClient: OpenClawAPIClient): void {
		const leaf = app.workspace.getLeaf(true);
		leaf.setViewState({
			type: MEMORY_VIEW_TYPE_FIXED,
			active: true
		});
	}
}