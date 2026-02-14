import { App, ItemView, WorkspaceLeaf, TFile, MarkdownRenderer } from 'obsidian';
import { OpenClawAPIClient, MemoryFile } from '../api-client';

export const MEMORY_VIEW_TYPE = 'openclaw-memory-view';

export class MemoryView extends ItemView {
	private apiClient: OpenClawAPIClient;
	private files: MemoryFile[] = [];
	private filteredFiles: MemoryFile[] = [];
	private searchQuery: string = '';
	private currentPage: number = 1;
	private pageSize: number = 20;
	private isLoading: boolean = false;

	constructor(app: App, apiClient: OpenClawAPIClient) {
		super(app);
		this.apiClient = apiClient;
	}

	getViewType(): string {
		return MEMORY_VIEW_TYPE;
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
		header.createEl('h2', { text: '📚 OpenClaw记忆库' });
		
		// 创建控制栏
		const controls = header.createDiv({ cls: 'openclaw-memory-controls' });
		
		// 搜索框
		const searchContainer = controls.createDiv({ cls: 'openclaw-search-container' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: '搜索记忆...',
			cls: 'openclaw-search-input'
		});
		
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.filterFiles();
			this.renderFileList();
		});
		
		// 刷新按钮
		const refreshButton = controls.createEl('button', {
			text: '🔄 刷新',
			cls: 'openclaw-refresh-button'
		});
		
		refreshButton.addEventListener('click', () => {
			this.loadFiles();
		});
		
		// 创建内容区域
		const content = mainContainer.createDiv({ cls: 'openclaw-memory-content' });
		
		// 文件列表容器
		this.fileListContainer = content.createDiv({ cls: 'openclaw-file-list-container' });
		
		// 加载文件
		await this.loadFiles();
	}

	async onClose(): Promise<void> {
		// 清理资源
	}

	private async loadFiles(): Promise<void> {
		this.isLoading = true;
		this.renderLoading();
		
		try {
			this.files = await this.apiClient.getFiles();
			this.filterFiles();
			this.renderFileList();
		} catch (error) {
			this.renderError(error.message);
		} finally {
			this.isLoading = false;
		}
	}

	private filterFiles(): void {
		if (!this.searchQuery.trim()) {
			this.filteredFiles = [...this.files];
			return;
		}
		
		const query = this.searchQuery.toLowerCase();
		this.filteredFiles = this.files.filter(file => 
			file.name.toLowerCase().includes(query) ||
			file.path.toLowerCase().includes(query) ||
			file.preview.toLowerCase().includes(query)
		);
	}

	private renderLoading(): void {
		this.fileListContainer.empty();
		this.fileListContainer.createEl('div', {
			text: '正在加载记忆文件...',
			cls: 'openclaw-loading'
		});
	}

	private renderError(message: string): void {
		this.fileListContainer.empty();
		this.fileListContainer.createEl('div', {
			text: `加载失败: ${message}`,
			cls: 'openclaw-error'
		});
	}

	private renderFileList(): void {
		this.fileListContainer.empty();
		
		if (this.filteredFiles.length === 0) {
			if (this.searchQuery) {
				this.fileListContainer.createEl('div', {
					text: `没有找到包含"${this.searchQuery}"的记忆文件`,
					cls: 'openclaw-empty'
				});
			} else {
				this.fileListContainer.createEl('div', {
					text: '记忆库为空',
					cls: 'openclaw-empty'
				});
			}
			return;
		}
		
		// 统计信息
		const stats = this.fileListContainer.createDiv({ cls: 'openclaw-stats' });
		stats.createEl('span', {
			text: `共 ${this.filteredFiles.length} 个文件`
		});
		
		const totalSize = this.filteredFiles.reduce((sum, file) => sum + file.size, 0);
		stats.createEl('span', {
			text: `总大小: ${this.formatSize(totalSize)}`
		});
		
		// 文件列表
		const fileList = this.fileListContainer.createDiv({ cls: 'openclaw-file-list' });
		
		this.filteredFiles.forEach(file => {
			const fileItem = fileList.createDiv({ cls: 'openclaw-file-item' });
			
			// 文件图标和名称
			const header = fileItem.createDiv({ cls: 'openclaw-file-header' });
			header.createEl('span', {
				text: '📄',
				cls: 'openclaw-file-icon'
			});
			
			const fileName = header.createEl('span', {
				text: file.name,
				cls: 'openclaw-file-name'
			});
			
			fileName.addEventListener('click', () => {
				this.openFile(file);
			});
			
			// 文件信息
			const info = fileItem.createDiv({ cls: 'openclaw-file-info' });
			
			info.createEl('span', {
				text: `大小: ${this.formatSize(file.size)}`,
				cls: 'openclaw-file-size'
			});
			
			info.createEl('span', {
				text: `行数: ${file.lines}`,
				cls: 'openclaw-file-lines'
			});
			
			info.createEl('span', {
				text: `修改: ${this.formatDate(file.modified)}`,
				cls: 'openclaw-file-modified'
			});
			
			// 文件路径
			const path = fileItem.createDiv({ cls: 'openclaw-file-path' });
			path.createEl('span', {
				text: file.path,
				cls: 'openclaw-file-path-text'
			});
			
			// 预览
			if (file.preview) {
				const preview = fileItem.createDiv({ cls: 'openclaw-file-preview' });
				preview.createEl('span', {
					text: file.preview.substring(0, 100) + (file.preview.length > 100 ? '...' : ''),
					cls: 'openclaw-file-preview-text'
				});
			}
			
			// 操作按钮
			const actions = fileItem.createDiv({ cls: 'openclaw-file-actions' });
			
			const openButton = actions.createEl('button', {
				text: '打开',
				cls: 'openclaw-action-button'
			});
			
			openButton.addEventListener('click', () => {
				this.openFile(file);
			});
			
			const deleteButton = actions.createEl('button', {
				text: '删除',
				cls: 'openclaw-action-button openclaw-action-delete'
			});
			
			deleteButton.addEventListener('click', () => {
				this.deleteFile(file);
			});
		});
		
		// 分页控件
		if (this.filteredFiles.length > this.pageSize) {
			this.renderPagination();
		}
	}

	private renderPagination(): void {
		const totalPages = Math.ceil(this.filteredFiles.length / this.pageSize);
		
		const pagination = this.fileListContainer.createDiv({ cls: 'openclaw-pagination' });
		
		if (this.currentPage > 1) {
			const prevButton = pagination.createEl('button', {
				text: '上一页',
				cls: 'openclaw-page-button'
			});
			
			prevButton.addEventListener('click', () => {
				this.currentPage--;
				this.renderFileList();
			});
		}
		
		pagination.createEl('span', {
			text: `第 ${this.currentPage} 页 / 共 ${totalPages} 页`,
			cls: 'openclaw-page-info'
		});
		
		if (this.currentPage < totalPages) {
			const nextButton = pagination.createEl('button', {
				text: '下一页',
				cls: 'openclaw-page-button'
			});
			
			nextButton.addEventListener('click', () => {
				this.currentPage++;
				this.renderFileList();
			});
		}
	}

	private async openFile(file: MemoryFile): Promise<void> {
		try {
			const fileContent = await this.apiClient.getFile(file.name);
			
			// 创建临时文件在Obsidian中打开
			const tempFileName = `OpenClaw/${file.name}`;
			const tempFile = this.app.vault.getAbstractFileByPath(tempFileName);
			
			if (tempFile instanceof TFile) {
				await this.app.vault.modify(tempFile, fileContent.content);
			} else {
				await this.app.vault.create(tempFileName, fileContent.content);
			}
			
			// 打开文件
			const leaf = this.app.workspace.getLeaf();
			await leaf.openFile(this.app.vault.getAbstractFileByPath(tempFileName) as TFile);
			
		} catch (error) {
			console.error('打开文件失败:', error);
		}
	}

	private async deleteFile(file: MemoryFile): Promise<void> {
		const confirmed = await confirm(`确定要删除文件 "${file.name}" 吗？`);
		
		if (confirmed) {
			try {
				await this.apiClient.deleteFile(file.name);
				await this.loadFiles(); // 重新加载文件列表
			} catch (error) {
				console.error('删除文件失败:', error);
			}
		}
	}

	private formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	private formatDate(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			return '今天';
		} else if (diffDays === 1) {
			return '昨天';
		} else if (diffDays < 7) {
			return `${diffDays}天前`;
		} else {
			return date.toLocaleDateString();
		}
	}

	// 公开方法
	open(): void {
		const leaf = this.app.workspace.getLeaf(false);
		leaf.setViewState({
			type: MEMORY_VIEW_TYPE,
			active: true
		});
	}

	refresh(): void {
		this.loadFiles();
	}

	private fileListContainer: HTMLElement;
}