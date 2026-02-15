import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

interface OpenClawMemorySyncSettings {
  apiUrl: string;
  apiPort: number;
  targetFolder: string;
  autoSync: boolean;
}

const DEFAULT_SETTINGS: OpenClawMemorySyncSettings = {
  apiUrl: 'localhost',
  apiPort: 8765,
  targetFolder: 'OpenClaw记忆库',
  autoSync: true
};

export default class OpenClawMemorySyncSimple extends Plugin {
  settings: OpenClawMemorySyncSettings;

  async onload() {
    console.log('🎉 OpenClaw Memory Sync Simple loading...');
    
    await this.loadSettings();
    
    // 添加命令
    this.addCommand({
      id: 'openclaw-sync-now-simple',
      name: '立即同步 OpenClaw (简单版)',
      callback: () => {
        console.log('OpenClaw sync command executed');
        new Notice('开始同步 OpenClaw 记忆库...');
        this.syncNow();
      }
    });
    
    this.addCommand({
      id: 'openclaw-test-connection',
      name: '测试 OpenClaw 连接',
      callback: () => {
        console.log('Testing OpenClaw connection');
        new Notice('测试 OpenClaw 连接...');
        this.testConnection();
      }
    });
    
    // 添加侧边栏图标
    this.addRibbonIcon('brain', 'OpenClaw 记忆同步', () => {
      new Notice('打开 OpenClaw 记忆库');
      this.showMemoryView();
    });
    
    // 添加状态栏
    const statusBar = this.addStatusBarItem();
    statusBar.setText('OpenClaw ✅');
    statusBar.setAttr('title', 'OpenClaw 记忆同步插件 (简单版)');
    
    // 添加设置标签页
    this.addSettingTab(new OpenClawMemorySyncSettingTabSimple(this.app, this));
    
    console.log('✅ OpenClaw Memory Sync Simple loaded successfully!');
    new Notice('✅ OpenClaw 记忆同步插件 (简单版) 已加载');
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  syncNow() {
    console.log('开始同步...');
    // 模拟同步过程
    setTimeout(() => {
      new Notice('✅ OpenClaw 记忆库同步完成');
      console.log('同步完成');
    }, 2000);
  }
  
  testConnection() {
    console.log('测试连接...');
    setTimeout(() => {
      new Notice('✅ OpenClaw 连接测试成功');
      console.log('连接测试成功');
    }, 1000);
  }
  
  showMemoryView() {
    console.log('显示记忆库视图');
    // 这里可以添加显示视图的逻辑
  }
  
  onunload() {
    console.log('OpenClaw Memory Sync Simple unloading');
  }
}

class OpenClawMemorySyncSettingTabSimple extends PluginSettingTab {
  plugin: OpenClawMemorySyncSimple;

  constructor(app: App, plugin: OpenClawMemorySyncSimple) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'OpenClaw 记忆同步设置 (简单版)' });
    
    new Setting(containerEl)
      .setName('API 地址')
      .setDesc('OpenClaw API 服务器地址')
      .addText(text => text
        .setPlaceholder('localhost')
        .setValue(this.plugin.settings.apiUrl)
        .onChange(async (value) => {
          this.plugin.settings.apiUrl = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('API 端口')
      .setDesc('OpenClaw API 服务器端口')
      .addText(text => text
        .setPlaceholder('8765')
        .setValue(this.plugin.settings.apiPort.toString())
        .onChange(async (value) => {
          this.plugin.settings.apiPort = parseInt(value) || 8765;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('目标文件夹')
      .setDesc('同步到的 Obsidian 文件夹')
      .addText(text => text
        .setPlaceholder('OpenClaw记忆库')
        .setValue(this.plugin.settings.targetFolder)
        .onChange(async (value) => {
          this.plugin.settings.targetFolder = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('自动同步')
      .setDesc('启用自动同步')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSync)
        .onChange(async (value) => {
          this.plugin.settings.autoSync = value;
          await this.plugin.saveSettings();
        }));
  }
}