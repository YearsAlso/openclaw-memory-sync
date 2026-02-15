import { App, ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { SyncEngine, SyncStatus, SyncState, SyncError } from '../../sync-engine';

export const SYNC_STATUS_VIEW_TYPE = 'openclaw-sync-status-view';

export class SyncStatusView extends ItemView {
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
    const header = mainContainer.createDiv({ cls: 'sync-status-header' });
    header.createEl('h2', { text: 'OpenClaw同步状态' });

    // 创建控制栏
    const controls = mainContainer.createDiv({ cls: 'sync-controls' });

    // 立即同步按钮
    const syncNowButton = controls.createEl('button', {
      text: '立即同步',
      cls: 'sync-now-button'
    });
    syncNowButton.addEventListener('click', () => {
      this.syncEngine.sync().catch(error => {
        new Notice(`同步失败: ${error.message}`);
      });
    });

    // 暂停/恢复按钮
    const pauseResumeButton = controls.createEl('button', {
      text: this.syncEngine.isPausedState() ? '恢复同步' : '暂停同步',
      cls: 'pause-resume-button'
    });
    pauseResumeButton.addEventListener('click', () => {
      if (this.syncEngine.isPausedState()) {
        this.syncEngine.resume();
        pauseResumeButton.setText('暂停同步');
        new Notice('同步已恢复');
      } else {
        this.syncEngine.pause();
        pauseResumeButton.setText('恢复同步');
        new Notice('同步已暂停');
      }
    });

    // 自动刷新开关
    const autoRefreshContainer = controls.createDiv({ cls: 'auto-refresh-container' });
    const autoRefreshCheckbox = autoRefreshContainer.createEl('input', {
      type: 'checkbox',
      cls: 'auto-refresh-checkbox'
    });
    autoRefreshCheckbox.id = 'auto-refresh';
    autoRefreshCheckbox.checked = this.isAutoRefresh;
    autoRefreshCheckbox.addEventListener('change', e => {
      this.isAutoRefresh = (e.target as HTMLInputElement).checked;
      if (this.isAutoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
    autoRefreshContainer.createEl('label', {
      text: '自动刷新',
      attr: { for: 'auto-refresh' }
    });

    // 手动刷新按钮
    const refreshButton = controls.createEl('button', {
      text: '刷新',
      cls: 'refresh-button'
    });
    refreshButton.addEventListener('click', () => {
      this.render();
    });

    // 创建状态内容容器
    this.contentEl = mainContainer.createDiv({ cls: 'sync-status-content' });

    // 开始自动刷新
    if (this.isAutoRefresh) {
      this.startAutoRefresh();
    }

    // 初始渲染
    this.render();
  }

  async onClose(): Promise<void> {
    this.stopAutoRefresh();
  }

  private render(): void {
    this.contentEl.empty();

    // 状态卡片
    const statusCard = this.contentEl.createDiv({ cls: 'status-card' });

    // 状态图标和文本
    const statusHeader = statusCard.createDiv({ cls: 'status-header' });

    const statusIcon = statusHeader.createEl('span', {
      text: this.getStatusIcon(),
      cls: 'status-icon'
    });

    const statusText = statusHeader.createEl('span', {
      text: this.getStatusText(),
      cls: `status-text status-${this.status.state}`
    });

    // 进度条
    if (this.status.state === SyncState.SYNCING) {
      const progressContainer = statusCard.createDiv({ cls: 'progress-container' });

      const progressBar = progressContainer.createEl('div', { cls: 'progress-bar' });
      const progressFill = progressBar.createEl('div', {
        cls: 'progress-fill',
        attr: { style: `width: ${this.status.progress}%` }
      });

      const progressText = progressContainer.createEl('div', {
        text: `${this.status.progress.toFixed(1)}%`,
        cls: 'progress-text'
      });
    }

    // 当前文件
    if (this.status.currentFile) {
      const currentFile = statusCard.createDiv({ cls: 'current-file' });
      currentFile.createEl('strong', { text: '当前文件: ' });
      currentFile.createEl('span', { text: this.status.currentFile });
    }

    // 统计信息
    const stats = statusCard.createDiv({ cls: 'stats' });

    if (this.status.filesSynced > 0) {
      stats.createEl('div', {
        text: `已同步文件: ${this.status.filesSynced}`,
        cls: 'stat-item'
      });
    }

    if (this.status.totalFiles > 0) {
      stats.createEl('div', {
        text: `总文件数: ${this.status.totalFiles}`,
        cls: 'stat-item'
      });
    }

    if (this.status.lastSync) {
      stats.createEl('div', {
        text: `最后同步: ${this.formatDate(this.status.lastSync)}`,
        cls: 'stat-item'
      });
    }

    // 错误信息
    if (this.status.errors.length > 0) {
      const errorsSection = this.contentEl.createDiv({ cls: 'errors-section' });
      errorsSection.createEl('h3', { text: '错误日志' });

      const errorsList = errorsSection.createEl('div', { cls: 'errors-list' });

      this.status.errors.forEach((error, index) => {
        const errorItem = errorsList.createEl('div', { cls: 'error-item' });

        const errorHeader = errorItem.createEl('div', { cls: 'error-header' });
        errorHeader.createEl('span', {
          text: '❌',
          cls: 'error-icon'
        });

        errorHeader.createEl('span', {
          text: error.message,
          cls: 'error-message'
        });

        errorHeader.createEl('span', {
          text: this.formatDate(error.timestamp),
          cls: 'error-time'
        });

        // 错误详情切换
        const toggleButton = errorHeader.createEl('button', {
          text: this.errorDetailsVisible.get(index) ? '隐藏详情' : '显示详情',
          cls: 'error-toggle-button'
        });

        toggleButton.addEventListener('click', () => {
          const isVisible = this.errorDetailsVisible.get(index) || false;
          this.errorDetailsVisible.set(index, !isVisible);
          this.render();
        });

        // 错误详情
        if (this.errorDetailsVisible.get(index)) {
          const errorDetails = errorItem.createEl('div', { cls: 'error-details' });

          if (error.file) {
            errorDetails.createEl('div', {
              text: `文件: ${error.file}`,
              cls: 'error-file'
            });
          }

          errorDetails.createEl('div', {
            text: `时间: ${error.timestamp.toLocaleString()}`,
            cls: 'error-timestamp'
          });

          errorDetails.createEl('div', {
            text: `可重试: ${error.retryable ? '是' : '否'}`,
            cls: 'error-retryable'
          });

          // 重试按钮
          if (error.retryable && error.file) {
            const retryButton = errorDetails.createEl('button', {
              text: '重试',
              cls: 'retry-button'
            });

            retryButton.addEventListener('click', () => {
              // 这里可以添加重试逻辑
              new Notice(`重试文件: ${error.file}`);
            });
          }
        }
      });

      // 清除错误按钮
      if (this.status.errors.length > 0) {
        const clearErrorsButton = errorsSection.createEl('button', {
          text: '清除所有错误',
          cls: 'clear-errors-button'
        });

        clearErrorsButton.addEventListener('click', () => {
          // 这里可以添加清除错误逻辑
          new Notice('错误日志已清除');
        });
      }
    }

    // 操作历史
    const historySection = this.contentEl.createDiv({ cls: 'history-section' });
    historySection.createEl('h3', { text: '同步历史' });

    // 这里可以添加同步历史记录
    const historyPlaceholder = historySection.createEl('div', {
      text: '同步历史记录将在这里显示',
      cls: 'history-placeholder'
    });

    // 性能统计
    const performanceSection = this.contentEl.createDiv({ cls: 'performance-section' });
    performanceSection.createEl('h3', { text: '性能统计' });

    const performanceStats = performanceSection.createDiv({ cls: 'performance-stats' });

    // 这里可以添加性能统计数据
    performanceStats.createEl('div', {
      text: '平均同步时间: --',
      cls: 'performance-item'
    });

    performanceStats.createEl('div', {
      text: '最快同步时间: --',
      cls: 'performance-item'
    });

    performanceStats.createEl('div', {
      text: '最慢同步时间: --',
      cls: 'performance-item'
    });

    performanceStats.createEl('div', {
      text: '成功率: --',
      cls: 'performance-item'
    });
  }

  private getStatusIcon(): string {
    switch (this.status.state) {
      case SyncState.IDLE:
        return '✅';
      case SyncState.SYNCING:
        return '🔄';
      case SyncState.CONFLICT:
        return '⚠️';
      case SyncState.ERROR:
        return '❌';
      case SyncState.PAUSED:
        return '⏸️';
      default:
        return '❓';
    }
  }

  private getStatusText(): string {
    switch (this.status.state) {
      case SyncState.IDLE:
        return '空闲';
      case SyncState.SYNCING:
        return '同步中';
      case SyncState.CONFLICT:
        return '存在冲突';
      case SyncState.ERROR:
        return '错误';
      case SyncState.PAUSED:
        return '已暂停';
      default:
        return '未知状态';
    }
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshIntervalId = window.setInterval(() => {
      this.render();
    }, 5000); // 每5秒刷新一次
  }

  private stopAutoRefresh(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = 0;
    }
  }

  static open(app: App, syncEngine: SyncEngine): void {
    const leaf = app.workspace.getLeaf(true);
    leaf.setViewState({
      type: SYNC_STATUS_VIEW_TYPE,
      active: true
    });
  }
}
