import { App, ItemView, WorkspaceLeaf } from 'obsidian';
import { SyncEngine, SyncStatus, SyncState } from '../sync-engine';

export const SYNC_STATUS_VIEW_TYPE = 'openclaw-sync-status-view';

export class SyncStatusView extends ItemView {
	private syncEngine: SyncEngine;
	private status: SyncStatus;
	private updateInterval: number;

	constructor(app: App, syncEngine: SyncEngine) {
		super(app);
		this.syncEngine = syncEngine;
		this.status = syncEngine.getStatus();
	}

	getViewType(): string {
		return SYNC_STATUS_VIEW_TYPE;
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
		const header = mainContainer.createDiv({ cls: 'openclaw-sync-header' });
		header.createEl('h2', { text: '🔄 OpenClaw同步状态' });
		
		// 创建内容区域
		this.contentContainer = mainContainer.createDiv({ cls: 'openclaw-sync-content' });
		
		// 监听状态变化
		this.syncEngine.onStatusChange((status: SyncStatus) => {
			this.status = status;
			this.renderContent();
		});
		
		// 初始渲染
		this.renderContent();
		
		// 启动定时更新
		this.updateInterval = window.setInterval(() => {
			this.renderContent();
		}, 1000);
	}

	async onClose(): Promise<void> {
		// 清理定时器
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}
		
		// 移除状态监听
		// 注意：syncEngine目前没有提供offStatusChange方法
		// 在实际实现中需要添加
	}

	private renderContent(): void {
		this.contentContainer.empty();
		
		// 状态卡片
		const statusCard = this.contentContainer.createDiv({ cls: 'openclaw-status-card' });
		
		// 状态指示器
		const statusIndicator = statusCard.createDiv({ cls: 'openclaw-status-indicator' });
		
		const statusIcon = statusIndicator.createEl('span', {
			cls: 'openclaw-status-icon'
		});
		
		const statusText = statusIndicator.createEl('span', {
			cls: 'openclaw-status-text'
		});
		
		// 根据状态设置图标和文本
		switch (this.status.state) {
			case SyncState.IDLE:
				statusIcon.setText('✅');
				statusText.setText('空闲');
				statusIndicator.addClass('openclaw-status-idle');
				break;
				
			case SyncState.SYNCING:
				statusIcon.setText('🔄');
				statusText.setText('同步中');
				statusIndicator.addClass('openclaw-status-syncing');
				break;
				
			case SyncState.CONFLICT:
				statusIcon.setText('⚠️');
				statusText.setText('冲突');
				statusIndicator.addClass('openclaw-status-conflict');
				break;
				
			case SyncState.ERROR:
				statusIcon.setText('❌');
				statusText.setText('错误');
				statusIndicator.addClass('openclaw-status-error');
				break;
				
			case SyncState.PAUSED:
				statusIcon.setText('⏸️');
				statusText.setText('已暂停');
				statusIndicator.addClass('openclaw-status-paused');
				break;
		}
		
		// 进度条
		if (this.status.state === SyncState.SYNCING) {
			const progressContainer = statusCard.createDiv({ cls: 'openclaw-progress-container' });
			
			const progressBar = progressContainer.createDiv({ cls: 'openclaw-progress-bar' });
			const progressFill = progressBar.createDiv({ cls: 'openclaw-progress-fill' });
			progressFill.style.width = `${this.status.progress}%`;
			
			const progressText = progressContainer.createEl('span', {
				text: `${this.status.progress.toFixed(1)}%`,
				cls: 'openclaw-progress-text'
			});
		}
		
		// 当前文件
		if (this.status.currentFile) {
			const currentFile = statusCard.createDiv({ cls: 'openclaw-current-file' });
			currentFile.createEl('span', {
				text: '当前文件:',
				cls: 'openclaw-current-file-label'
			});
			currentFile.createEl('span', {
				text: this.status.currentFile,
				cls: 'openclaw-current-file-name'
			});
		}
		
		// 统计信息
		const stats = statusCard.createDiv({ cls: 'openclaw-sync-stats' });
		
		if (this.status.totalFiles > 0) {
			stats.createEl('div', {
				text: `文件: ${this.status.filesSynced} / ${this.status.totalFiles}`,
				cls: 'openclaw-stat-item'
			});
		}
		
		if (this.status.lastSync) {
			const lastSyncText = stats.createEl('div', {
				cls: 'openclaw-stat-item'
			});
			
			lastSyncText.createEl('span', {
				text: '上次同步:',
				cls: 'openclaw-stat-label'
			});
			
			lastSyncText.createEl('span', {
				text: this.formatTimeAgo(this.status.lastSync),
				cls: 'openclaw-stat-value'
			});
		}
		
		// 控制按钮
		const controls = this.contentContainer.createDiv({ cls: 'openclaw-sync-controls' });
		
		// 同步按钮
		const syncButton = controls.createEl('button', {
			text: '🔄 立即同步',
			cls: 'openclaw-control-button openclaw-control-sync'
		});
		
		syncButton.addEventListener('click', () => {
			this.syncEngine.sync().catch(console.error);
		});
		
		// 暂停/恢复按钮
		if (this.status.state === SyncState.SYNCING || this.status.state === SyncState.PAUSED) {
			const pauseResumeButton = controls.createEl('button', {
				text: this.status.state === SyncState.PAUSED ? '▶️ 恢复' : '⏸️ 暂停',
				cls: 'openclaw-control-button openclaw-control-pause'
			});
			
			pauseResumeButton.addEventListener('click', () => {
				if (this.status.state === SyncState.PAUSED) {
					this.syncEngine.resume();
				} else {
					this.syncEngine.pause();
				}
			});
		}
		
		// 错误列表
		if (this.status.errors.length > 0) {
			const errorsContainer = this.contentContainer.createDiv({ cls: 'openclaw-errors-container' });
			errorsContainer.createEl('h3', { text: '错误日志' });
			
			const errorsList = errorsContainer.createDiv({ cls: 'openclaw-errors-list' });
			
			this.status.errors.forEach((error, index) => {
				const errorItem = errorsList.createDiv({ cls: 'openclaw-error-item' });
				
				errorItem.createEl('span', {
					text: '❌',
					cls: 'openclaw-error-icon'
				});
				
				const errorContent = errorItem.createDiv({ cls: 'openclaw-error-content' });
				
				errorContent.createEl('div', {
					text: error.message,
					cls: 'openclaw-error-message'
				});
				
				if (error.file) {
					errorContent.createEl('div', {
						text: `文件: ${error.file}`,
						cls: 'openclaw-error-file'
					});
				}
				
				errorContent.createEl('div', {
					text: this.formatTimeAgo(error.timestamp),
					cls: 'openclaw-error-time'
				});
				
				if (error.retryable) {
					const retryButton = errorItem.createEl('button', {
						text: '重试',
						cls: 'openclaw-error-retry'
					});
					
					retryButton.addEventListener('click', () => {
						// 在实际实现中，这里应该触发重试逻辑
						console.log('重试错误:', error);
					});
				}
			});
			
			// 清除错误按钮
			if (this.status.errors.length > 0) {
				const clearErrorsButton = errorsContainer.createEl('button', {
					text: '清除错误',
					cls: 'openclaw-control-button openclaw-control-clear'
				});
				
				clearErrorsButton.addEventListener('click', () => {
					// 在实际实现中，这里应该清除错误
					console.log('清除错误');
				});
			}
		}
		
		// 详细统计
		this.renderDetailedStats();
	}

	private renderDetailedStats(): void {
		const statsContainer = this.contentContainer.createDiv({ cls: 'openclaw-detailed-stats' });
		statsContainer.createEl('h3', { text: '同步统计' });
		
		const statsGrid = statsContainer.createDiv({ cls: 'openclaw-stats-grid' });
		
		// 这里可以添加更多统计信息
		// 例如：同步次数、平均同步时间、成功/失败率等
		
		const statItems = [
			{ label: '同步状态', value: this.getStateText(this.status.state) },
			{ label: '同步进度', value: `${this.status.progress.toFixed(1)}%` },
			{ label: '已同步文件', value: this.status.filesSynced.toString() },
			{ label: '总文件数', value: this.status.totalFiles.toString() },
			{ label: '错误数量', value: this.status.errors.length.toString() }
		];
		
		statItems.forEach(item => {
			const statItem = statsGrid.createDiv({ cls: 'openclaw-stat-grid-item' });
			
			statItem.createEl('div', {
				text: item.label,
				cls: 'openclaw-stat-grid-label'
			});
			
			statItem.createEl('div', {
				text: item.value,
				cls: 'openclaw-stat-grid-value'
			});
		});
	}

	private getStateText(state: SyncState): string {
		switch (state) {
			case SyncState.IDLE: return '空闲';
			case SyncState.SYNCING: return '同步中';
			case SyncState.CONFLICT: return '冲突';
			case SyncState.ERROR: return '错误';
			case SyncState.PAUSED: return '已暂停';
			default: return '未知';
		}
	}

	private formatTimeAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		
		if (diffSec < 60) {
			return `${diffSec}秒前`;
		} else if (diffMin < 60) {
			return `${diffMin}分钟前`;
		} else if (diffHour < 24) {
			return `${diffHour}小时前`;
		} else {
			return date.toLocaleString();
		}
	}

	// 公开方法
	open(): void {
		const leaf = this.app.workspace.getLeaf(false);
		leaf.setViewState({
			type: SYNC_STATUS_VIEW_TYPE,
			active: true
		});
	}

	refresh(): void {
		this.renderContent();
	}

	private contentContainer: HTMLElement;
}