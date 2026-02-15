import { App, ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { SyncEngine, SyncStatus, SyncState, SyncError } from '../../sync-engine';

// 使用唯一视图类型名称，避免冲突
export const SYNC_STATUS_VIEW_TYPE_FIXED = 'openclaw-sync-status-view-fixed-' + Date.now();

export class SyncStatusViewFixed extends ItemView {
	private syncEngine: SyncEngine;
	private status: SyncStatus;
	private isAutoRefresh: boolean = true;
	private refreshIntervalId: number = 0;
	private errorDetailsVisible: Map<number, boolean> = new Map();

	constructor(leaf: WorkspaceLeaf, syncEngine: SyncEngine) {
		super(leaf);
		this.syncEngine = syncEngine;
		this.status = syncEngine.getStatus();

		// 监听状态变化
		this.syncEngine.onStatusChange((newStatus: SyncStatus) => {
			this.status = newStatus;
			this.render();
		});
	}

	getViewType(): string {
		return SYNC_STATUS_VIEW_TYPE_FIXED;
	}

	getDisplayText(): string {
		return 'OpenClaw同步状态';
	}

	getIcon(): string {
		return 'refresh-cw';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();

		// 创建主容器
		const mainContainer = container.createDiv({ cls: 'openclaw-sync-status-view' });

		// 创建标题栏
		const header = mainContainer.createDiv({ cls: 'sync-status-header' });
		header.createEl('h2', { text: 'OpenClaw同步状态' });

		// 创建状态显示区域
		this.renderStatus(mainContainer);

		// 创建控制按钮
		this.renderControls(mainContainer);

		// 如果启用自动刷新，设置定时器
		if (this.isAutoRefresh) {
			this.startAutoRefresh();
		}
	}

	renderStatus(container: HTMLElement): void {
		const statusContainer = container.createDiv({ cls: 'sync-status-container' });
		
		// 状态图标和文本
		const statusRow = statusContainer.createDiv({ cls: 'status-row' });
		const statusIcon = statusRow.createSpan({ cls: 'status-icon' });
		const statusText = statusRow.createEl('span', { cls: 'status-text' });
		
		switch (this.status.state) {
			case SyncState.IDLE:
				statusIcon.setText('✅');
				statusText.setText('空闲');
				break;
			case SyncState.SYNCING:
				statusIcon.setText('🔄');
				statusText.setText('同步中...');
				break;
			case SyncState.CONFLICT:
				statusIcon.setText('⚠️');
				statusText.setText('有冲突需要解决');
				break;
			case SyncState.ERROR:
				statusIcon.setText('❌');
				statusText.setText('同步错误');
				break;
		}
		
		// 进度信息
		if (this.status.progress) {
			const progressRow = statusContainer.createDiv({ cls: 'progress-row' });
			progressRow.createEl('div', { 
				text: `进度: ${this.status.progress.current}/${this.status.progress.total} 文件` 
			});
			
			if (this.status.progress.total > 0) {
				const progressPercent = (this.status.progress.current / this.status.progress.total) * 100;
				const progressBar = progressRow.createDiv({ cls: 'progress-bar' });
				const progressFill = progressBar.createDiv({ cls: 'progress-fill' });
				progressFill.style.width = `${progressPercent}%`;
			}
		}
		
		// 错误信息
		if (this.status.errors && this.status.errors.length > 0) {
			const errorContainer = statusContainer.createDiv({ cls: 'error-container' });
			errorContainer.createEl('h4', { text: '错误列表:' });
			
			this.status.errors.forEach((error, index) => {
				const errorItem = errorContainer.createDiv({ cls: 'error-item' });
				const errorHeader = errorItem.createDiv({ cls: 'error-header' });
				errorHeader.createEl('span', { text: `❌ ${error.message}` });
				
				const toggleBtn = errorHeader.createEl('button', { 
					text: '详情',
					cls: 'error-detail-toggle'
				});
				
				toggleBtn.addEventListener('click', () => {
					const isVisible = this.errorDetailsVisible.get(index) || false;
					this.errorDetailsVisible.set(index, !isVisible);
					this.render();
				});
				
				if (this.errorDetailsVisible.get(index)) {
					const errorDetail = errorItem.createDiv({ cls: 'error-detail' });
					errorDetail.createEl('pre', { text: error.stack || '无堆栈信息' });
				}
			});
		}
	}

	renderControls(container: HTMLElement): void {
		const controlsContainer = container.createDiv({ cls: 'sync-controls' });
		
		// 立即同步按钮
		const syncNowBtn = controlsContainer.createEl('button', {
			text: '立即同步',
			cls: 'mod-cta'
		});
		syncNowBtn.addEventListener('click', () => {
			this.syncEngine.syncNow();
			new Notice('开始同步...');
		});
		
		// 刷新按钮
		const refreshBtn = controlsContainer.createEl('button', {
			text: '刷新状态',
			cls: 'mod-secondary'
		});
		refreshBtn.addEventListener('click', () => {
			this.status = this.syncEngine.getStatus();
			this.render();
			new Notice('状态已刷新');
		});
		
		// 自动刷新开关
		const autoRefreshContainer = controlsContainer.createDiv({ cls: 'auto-refresh-control' });
		const autoRefreshCheckbox = autoRefreshContainer.createEl('input', {
			type: 'checkbox',
			cls: 'auto-refresh-checkbox'
		});
		autoRefreshCheckbox.checked = this.isAutoRefresh;
		autoRefreshCheckbox.addEventListener('change', (e) => {
			this.isAutoRefresh = (e.target as HTMLInputElement).checked;
			if (this.isAutoRefresh) {
				this.startAutoRefresh();
			} else {
				this.stopAutoRefresh();
			}
		});
		autoRefreshContainer.createEl('label', { text: '自动刷新' });
	}

	startAutoRefresh(): void {
		this.stopAutoRefresh();
		this.refreshIntervalId = window.setInterval(() => {
			this.status = this.syncEngine.getStatus();
			this.render();
		}, 5000); // 每5秒刷新一次
	}

	stopAutoRefresh(): void {
		if (this.refreshIntervalId) {
			window.clearInterval(this.refreshIntervalId);
			this.refreshIntervalId = 0;
		}
	}

	render(): void {
		const container = this.containerEl.children[1];
		if (container.children.length > 0) {
			container.empty();
			this.onOpen();
		}
	}

	onClose(): Promise<void> {
		this.stopAutoRefresh();
		return Promise.resolve();
	}

	static open(app: App, syncEngine: SyncEngine): void {
		const leaf = app.workspace.getLeaf(true);
		leaf.setViewState({
			type: SYNC_STATUS_VIEW_TYPE_FIXED,
			active: true
		});
	}
}