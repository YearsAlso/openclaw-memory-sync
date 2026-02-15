import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder } from 'obsidian';
import { OpenClawAPIClient } from './api-client';
import { SyncEngine, SyncStatus } from './sync-engine';
import { MemoryView, MEMORY_VIEW_TYPE } from './src/views/memory-view';
import { SyncStatusView, SYNC_STATUS_VIEW_TYPE } from './src/views/sync-status';
import { Logger } from './src/utils/logger';

interface OpenClawMemorySyncSettings {
  apiUrl: string;
  apiPort: number;
  syncInterval: number;
  autoSync: boolean;
  conflictStrategy: 'timestamp' | 'local' | 'remote' | 'ask';
  excludePatterns: string[];
  enableWebSocket: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  targetFolder: string;
}

const DEFAULT_SETTINGS: OpenClawMemorySyncSettings = {
  apiUrl: 'localhost',
  apiPort: 8765,
  syncInterval: 300, // 5 minutes in seconds
  autoSync: true,
  conflictStrategy: 'timestamp',
  excludePatterns: ['*.tmp', '.*'],
  enableWebSocket: true,
  logLevel: 'info',
  targetFolder: 'OpenClaw记忆库'
};

export default class OpenClawMemorySync extends Plugin {
  settings: OpenClawMemorySyncSettings;
  apiClient: OpenClawAPIClient;
  syncEngine: SyncEngine;
  syncIntervalId: number;
  logger: Logger;

  async onload() {
    await this.loadSettings();

    // 初始化日志系统
    this.logger = new Logger(this.settings);

    this.logger.info('OpenClaw Memory Sync插件开始加载', 'plugin');

    // 初始化API客户端
    this.apiClient = new OpenClawAPIClient(this.settings);

    // 初始化同步引擎
    this.syncEngine = new SyncEngine(this.app, this.apiClient, this.settings);

    // 注册视图
    this.registerView(MEMORY_VIEW_TYPE, leaf => new MemoryView(leaf, this.apiClient));

    this.registerView(SYNC_STATUS_VIEW_TYPE, leaf => new SyncStatusView(leaf, this.syncEngine));

    // 注册视图类型
    // this.registerView(MEMORY_VIEW_TYPE, leaf => new MemoryView(leaf, this.apiClient));
    //
    // this.registerView(SYNC_STATUS_VIEW_TYPE, leaf => new SyncStatusView(leaf, this.syncEngine));

    // 添加设置标签页
    this.addSettingTab(new OpenClawMemorySyncSettingTab(this.app, this));

    // 添加命令
    this.addCommand({
      id: 'openclaw-sync-now',
      name: '立即同步',
      callback: () => this.syncNow()
    });

    this.addCommand({
      id: 'openclaw-view-memory',
      name: '查看记忆库',
      callback: () => MemoryView.open(this.app, this.apiClient)
    });

    this.addCommand({
      id: 'openclaw-view-status',
      name: '查看同步状态',
      callback: () => SyncStatusView.open(this.app, this.syncEngine)
    });

    // 添加侧边栏图标
    this.addRibbonIcon('brain', 'OpenClaw记忆同步', () => {
      SyncStatusView.open(this.app, this.syncEngine);
    });

    // 添加状态栏项目
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText('🔄 OpenClaw');

    // 监听同步状态变化
    this.syncEngine.onStatusChange((status: SyncStatus) => {
      const icons = {
        idle: '✅',
        syncing: '🔄',
        conflict: '⚠️',
        error: '❌',
        paused: '⏸️'
      };
      statusBarItem.setText(`${icons[status.state]} OpenClaw`);

      if (status.state === 'error' && status.errors.length > 0) {
        statusBarItem.setAttr('title', `同步错误: ${status.errors[0].message}`);
      } else {
        statusBarItem.setAttr('title', `同步状态: ${status.state}`);
      }
    });

    // 连接API服务器
    try {
      this.logger.info('正在连接OpenClaw API服务器...', 'api');
      await this.apiClient.connect();
      new Notice('✅ OpenClaw API连接成功');
      this.logger.info('OpenClaw API连接成功', 'api');
    } catch (error) {
      const errorMsg = `OpenClaw API连接失败: ${error.message}`;
      new Notice(`❌ ${errorMsg}`);
      this.logger.error(errorMsg, 'api', error);
    }

    // 启动自动同步
    if (this.settings.autoSync) {
      this.startAutoSync();
      this.logger.info(`自动同步已启动，间隔: ${this.settings.syncInterval}秒`, 'sync');
    }

    // 创建目标文件夹
    await this.ensureTargetFolder();

    this.logger.info('OpenClaw Memory Sync插件加载完成', 'plugin');
  }

  async onunload() {
    this.logger.info('OpenClaw Memory Sync插件开始卸载', 'plugin');

    // 停止自动同步
    this.stopAutoSync();

    // 断开API连接
    await this.apiClient.disconnect();

    // 清理资源
    this.syncEngine.cleanup();

    this.logger.info('OpenClaw Memory Sync插件卸载完成', 'plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async syncNow() {
    try {
      this.logger.info('开始手动同步OpenClaw记忆库', 'sync');
      new Notice('🔄 开始同步OpenClaw记忆库...');

      await this.syncEngine.sync();

      this.logger.info('OpenClaw记忆库同步完成', 'sync');
      new Notice('✅ OpenClaw记忆库同步完成');
    } catch (error) {
      const errorMsg = `同步失败: ${error.message}`;
      this.logger.error(errorMsg, 'sync', error);
      new Notice(`❌ ${errorMsg}`);
    }
  }

  startAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = window.setInterval(() => {
      if (this.syncEngine.getStatus().state === 'idle') {
        this.logger.debug('自动同步触发', 'sync');
        this.syncNow();
      }
    }, this.settings.syncInterval * 1000);

    this.logger.info(`自动同步已启动，间隔: ${this.settings.syncInterval}秒`, 'sync');
  }

  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = 0;
      this.logger.info('自动同步已停止', 'sync');
    }
  }

  async ensureTargetFolder() {
    const { vault } = this.app;
    const folderPath = this.settings.targetFolder;

    // 检查文件夹是否存在
    const folder = vault.getAbstractFileByPath(folderPath);

    if (!folder) {
      // 创建文件夹
      await vault.createFolder(folderPath);
      this.logger.info(`创建目标文件夹: ${folderPath}`, 'filesystem');
    } else if (!(folder instanceof TFolder)) {
      // 存在同名文件，不是文件夹
      this.logger.warn(`路径 ${folderPath} 已存在但不是文件夹`, 'filesystem');
    } else {
      this.logger.debug(`目标文件夹已存在: ${folderPath}`, 'filesystem');
    }
  }
}

class OpenClawMemorySyncSettingTab extends PluginSettingTab {
  plugin: OpenClawMemorySync;

  constructor(app: App, plugin: OpenClawMemorySync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'OpenClaw记忆同步设置' });

    // API设置
    new Setting(containerEl)
      .setName('API服务器地址')
      .setDesc('OpenClaw API服务器的地址')
      .addText(text =>
        text
          .setPlaceholder('localhost')
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async value => {
            this.plugin.settings.apiUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('API端口')
      .setDesc('OpenClaw API服务器的端口')
      .addText(text =>
        text
          .setPlaceholder('8765')
          .setValue(this.plugin.settings.apiPort.toString())
          .onChange(async value => {
            this.plugin.settings.apiPort = parseInt(value) || 8765;
            await this.plugin.saveSettings();
          })
      );

    // 同步设置
    new Setting(containerEl)
      .setName('自动同步')
      .setDesc('启用自动同步')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.autoSync).onChange(async value => {
          this.plugin.settings.autoSync = value;
          await this.plugin.saveSettings();

          if (value) {
            this.plugin.startAutoSync();
          } else {
            this.plugin.stopAutoSync();
          }
        })
      );

    new Setting(containerEl)
      .setName('同步间隔（秒）')
      .setDesc('自动同步的时间间隔')
      .addText(text =>
        text
          .setPlaceholder('300')
          .setValue(this.plugin.settings.syncInterval.toString())
          .onChange(async value => {
            this.plugin.settings.syncInterval = parseInt(value) || 300;
            await this.plugin.saveSettings();

            if (this.plugin.settings.autoSync) {
              this.plugin.stopAutoSync();
              this.plugin.startAutoSync();
            }
          })
      );

    new Setting(containerEl)
      .setName('冲突解决策略')
      .setDesc('当文件冲突时的解决策略')
      .addDropdown(dropdown =>
        dropdown
          .addOption('timestamp', '时间戳优先（最新的胜出）')
          .addOption('local', '本地优先')
          .addOption('remote', '远程优先')
          .addOption('ask', '询问用户')
          .setValue(this.plugin.settings.conflictStrategy)
          .onChange(async (value: any) => {
            this.plugin.settings.conflictStrategy = value;
            await this.plugin.saveSettings();
          })
      );

    // 文件夹设置
    new Setting(containerEl)
      .setName('目标文件夹')
      .setDesc('记忆文件保存的文件夹路径')
      .addText(text =>
        text
          .setPlaceholder('OpenClaw记忆库')
          .setValue(this.plugin.settings.targetFolder)
          .onChange(async value => {
            this.plugin.settings.targetFolder = value;
            await this.plugin.saveSettings();
            await this.plugin.ensureTargetFolder();
          })
      );

    // 高级设置
    new Setting(containerEl)
      .setName('启用WebSocket')
      .setDesc('启用实时更新通知')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.enableWebSocket).onChange(async value => {
          this.plugin.settings.enableWebSocket = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('排除模式')
      .setDesc('不同步的文件模式（每行一个）')
      .addTextArea(text =>
        text
          .setPlaceholder('*.tmp\n.*\nnode_modules/')
          .setValue(this.plugin.settings.excludePatterns.join('\n'))
          .onChange(async value => {
            this.plugin.settings.excludePatterns = value.split('\n').filter(p => p.trim());
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('日志级别')
      .setDesc('控制台日志的详细程度')
      .addDropdown(dropdown =>
        dropdown
          .addOption('debug', '调试')
          .addOption('info', '信息')
          .addOption('warn', '警告')
          .addOption('error', '错误')
          .setValue(this.plugin.settings.logLevel)
          .onChange(async (value: any) => {
            this.plugin.settings.logLevel = value;
            await this.plugin.saveSettings();
          })
      );

    // 测试连接按钮
    new Setting(containerEl)
      .setName('测试连接')
      .setDesc('测试与OpenClaw API服务器的连接')
      .addButton(button =>
        button.setButtonText('测试连接').onClick(async () => {
          try {
            await this.plugin.apiClient.testConnection();
            new Notice('✅ 连接测试成功');
          } catch (error) {
            new Notice(`❌ 连接测试失败: ${error.message}`);
          }
        })
      );

    // 立即同步按钮
    new Setting(containerEl)
      .setName('立即同步')
      .setDesc('手动触发同步')
      .addButton(button =>
        button.setButtonText('开始同步').onClick(async () => {
          await this.plugin.syncNow();
        })
      );
  }
}
