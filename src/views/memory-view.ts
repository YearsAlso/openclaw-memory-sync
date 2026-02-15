import { App, ItemView, WorkspaceLeaf, TFile, TFolder, Notice } from 'obsidian';
import { OpenClawAPIClient, MemoryFile } from '../../api-client';

export const MEMORY_VIEW_TYPE = 'openclaw-memory-view';

export class MemoryView extends ItemView {
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
		header.createEl('h2', { text: 'OpenClaw记忆库' });

		// 创建控制栏
		const controls = mainContainer.createDiv({ cls: 'openclaw-memory-controls' });

		// 搜索框
		const searchContainer = controls.createDiv({ cls: 'search-container' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: '搜索记忆文件...',
			cls: 'search-input'
		});
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;
			this.filterAndSortFiles();
			this.renderFileList();
		});

		// 排序选项
		const sortContainer = controls.createDiv({ cls: 'sort-container' });
		
		const sortBySelect = sortContainer.createEl('select', { cls: 'sort-select' });
		sortBySelect.createEl('option', { value: 'name', text: '按名称' });
		sortBySelect.createEl('option', { value: 'size', text: '按大小' });
		sortBySelect.createEl('option', { value: 'modified', text: '按修改时间' });
		sortBySelect.createEl('option', { value: 'created', text: '按创建时间' });
		sortBySelect.value = this.sortBy;
		sortBySelect.addEventListener('change', (e) => {
			this.sortBy = (e.target as HTMLSelectElement).value as any;
			this.filterAndSortFiles();
			this.renderFileList();
		});

		const sortOrderButton = sortContainer.createEl('button', {
			text: this.sortOrder === 'desc' ? '↓' : '↑',
			cls: 'sort-order-button'
		});
		sortOrderButton.addEventListener('click', () => {
			this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
			sortOrderButton.setText(this.sortOrder === 'desc' ? '↓' : '↑');
			this.filterAndSortFiles();
			this.renderFileList();
		});

		// 刷新按钮
		const refreshButton = controls.createEl('button', {
			text: '刷新',
			cls: 'refresh-button'
		});
		refreshButton.addEventListener('click', () => {
			this.refreshFiles();
		});

		// 创建文件列表容器
		const fileListContainer = mainContainer.createDiv({ cls: 'file-list-container' });
		this.contentEl = fileListContainer;

		// 创建状态栏
		const statusBar = mainContainer.createDiv({ cls: 'status-bar' });
		this.statusEl = statusBar;

		// 加载文件
		await this.refreshFiles();
	}

	async onClose(): Promise<void> {
		// 清理资源
	}

	async refreshFiles(): Promise<void> {
		this.isLoading = true;
		this.updateStatus('正在加载文件...');

		try {
			this.files = await this.apiClient.getFiles();
			this.lastRefresh = new Date();
			this.filterAndSortFiles();
			this.renderFileList();
			this.updateStatus(`已加载 ${this.files.length} 个文件`);
		} catch (error) {
			this.updateStatus(`加载失败: ${error.message}`, 'error');
			console.error('加载文件失败:', error);
		} finally {
			this.isLoading = false;
		}
	}

	private filterAndSortFiles(): void {
		// 过滤文件
		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase();
			this.filteredFiles = this.files.filter(file => 
				file.name.toLowerCase().includes(query) ||
				file.path.toLowerCase().includes(query)
			);
		} else {
			this.filteredFiles = [...this.files];
		}

		// 排序文件
		this.filteredFiles.sort((a, b) => {
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

			return this.sortOrder === 'desc' ? -comparison : comparison;
		});
	}

	private renderFileList(): void {
		this.contentEl.empty();

		if (this.filteredFiles.length === 0) {
			if (this.searchQuery.trim()) {
				this.contentEl.createEl('p', {
					text: `没有找到包含 "${this.searchQuery}" 的文件`,
					cls: 'no-results'
				});
			} else {
				this.contentEl.createEl('p', {
					text: '没有找到文件',
					cls: 'no-results'
				});
			}
			return;
		}

		// 创建文件列表
		const fileList = this.contentEl.createEl('div', { cls: 'file-list' });

		for (const file of this.filteredFiles) {
			const fileItem = fileList.createEl('div', { cls: 'file-item' });
			
			// 文件图标和名称
			const fileHeader = fileItem.createEl('div', { cls: 'file-header' });
			fileHeader.createEl('span', { 
				text: '📄',
				cls: 'file-icon'
			});
			
			const fileName = fileHeader.createEl('span', {
				text: file.name,
				cls: 'file-name'
			});
			fileName.addEventListener('click', () => {
				this.openFile(file);
			});

			// 文件信息
			const fileInfo = fileItem.createEl('div', { cls: 'file-info' });
			
			// 路径
			fileInfo.createEl('span', {
				text: file.path,
				cls: 'file-path'
			});

			// 大小
			fileInfo.createEl('span', {
				text: this.formatFileSize(file.size),
				cls: 'file-size'
			});

			// 行数
			fileInfo.createEl('span', {
				text: `${file.lines} 行`,
				cls: 'file-lines'
			});

			// 修改时间
			fileInfo.createEl('span', {
				text: this.formatDate(file.modified),
				cls: 'file-modified'
			});

			// 操作按钮
			const actions = fileItem.createEl('div', { cls: 'file-actions' });
			
			// 预览按钮
			const previewButton = actions.createEl('button', {
				text: '预览',
				cls: 'preview-button'
			});
			previewButton.addEventListener('click', () => {
				this.previewFile(file);
			});

			// 下载按钮
			const downloadButton = actions.createEl('button', {
				text: '下载',
				cls: 'download-button'
			});
			downloadButton.addEventListener('click', () => {
				this.downloadFile(file);
			});

			// 删除按钮
			const deleteButton = actions.createEl('button', {
				text: '删除',
				cls: 'delete-button'
			});
			deleteButton.addEventListener('click', () => {
				this.deleteFile(file);
			});
		}
	}

	private async openFile(file: MemoryFile): Promise<void> {
		try {
			const fileContent = await this.apiClient.getFile(file.name);
			
			// 在Obsidian中创建新标签页打开
			const leaf = this.app.workspace.getLeaf(true);
			await leaf.openFile(
				await this.app.vault.create(`${file.name}`, fileContent.content)
			);
		} catch (error) {
			new Notice(`打开文件失败: ${error.message}`);
			console.error('打开文件失败:', error);
		}
	}

	private async previewFile(file: MemoryFile): Promise<void> {
		try {
			const fileContent = await this.apiClient.getFile(file.name);
			
			// 创建预览模态框
			const modal = new PreviewModal(this.app, file.name, fileContent.content);
			modal.open();
		} catch (error) {
			new Notice(`预览文件失败: ${error.message}`);
			console.error('预览文件失败:', error);
		}
	}

	private async downloadFile(file: MemoryFile): Promise<void> {
		try {
			const fileContent = await this.apiClient.getFile(file.name);
			
			// 创建下载链接
			const blob = new Blob([fileContent.content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			new Notice(`已下载: ${file.name}`);
		} catch (error) {
			new Notice(`下载文件失败: ${error.message}`);
			console.error('下载文件失败:', error);
		}
	}

	private async deleteFile(file: MemoryFile): Promise<void> {
		const confirmed = await confirm(`确定要删除 "${file.name}" 吗？`);
		if (!confirmed) return;

		try {
			await this.apiClient.deleteFile(file.name);
			new Notice(`已删除: ${file.name}`);
			await this.refreshFiles();
		} catch (error) {
			new Notice(`删除文件失败: ${error.message}`);
			console.error('删除文件失败:', error);
		}
	}

	private updateStatus(message: string, type: 'info' | 'error' = 'info'): void {
		this.statusEl.empty();
		const statusText = this.statusEl.createEl('span', {
			text: message,
			cls: `status-text status-${type}`
		});

		if (this.lastRefresh) {
			this.statusEl.createEl('span', {
				text: ` | 最后更新: ${this.formatDate(this.lastRefresh)}`,
				cls: 'last-refresh'
			});
		}
	}

	private formatFileSize(bytes: number): string {
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
			// 今天
			return date.toLocaleTimeString();
		} else if (diffDays === 1) {
			// 昨天
			return '昨天 ' + date.toLocaleTimeString();
		} else if (diffDays < 7) {
			// 一周内
			return `${diffDays}天前`;
		} else {
			// 更早
			return date.toLocaleDateString();
		}
	}

	static open(app: App, apiClient: OpenClawAPIClient): void {
		const leaf = app.workspace.getLeaf(true);
		leaf.setViewState({
			type: MEMORY_VIEW_TYPE,
			active: true
		});
	}
}

class PreviewModal {
	private modal: any;

	constructor(app: App, title: string, content: string) {
		// 使用Obsidian的Modal类
		this.modal = new (class extends (app as any).Modal {
			constructor(app: App, private title: string, private content: string) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.createEl('h2', { text: this.title });
				
				const previewArea = contentEl.createEl('div', {
					cls: 'preview-area'
				});
				
				const textarea = previewArea.createEl('textarea', {
					value: this.content,
					cls: 'preview-textarea'
				});
				textarea.readOnly = true;
				textarea.style.width = '100%';
				textarea.style.height = '400px';
				textarea.style.fontFamily = 'monospace';
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		})(app, title, content);
	}

	open(): void {
		this.modal.open();
	}

	close(): void {
		this.modal.close();
	}
}