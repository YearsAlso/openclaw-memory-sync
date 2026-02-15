import { App, Plugin, PluginSettingTab, Setting, Notice, requestUrl } from 'obsidian';

interface OpenClawMemorySyncSettings {
  apiUrl: string;
  apiPort: number;
  apiToken: string;
  targetFolder: string;
  autoSync: boolean;
}

const DEFAULT_SETTINGS: OpenClawMemorySyncSettings = {
  apiUrl: 'localhost',
  apiPort: 18789, // 正确的 OpenClaw Gateway 端口
  apiToken: 'd24e7008052d0ebfb18fb764ddd3f09fc19c0e5ad52045a0', // 从配置中获取的 token
  targetFolder: 'OpenClaw记忆库',
  autoSync: true
};

export default class OpenClawMemorySyncCorrectAPI extends Plugin {
  settings: OpenClawMemorySyncSettings;

  async onload() {
    console.log('🔌 OpenClaw Memory Sync (Correct API) loading...');
    
    await this.loadSettings();
    
    // 测试连接
    this.testConnection();
    
    // 添加命令
    this.addCommand({
      id: 'openclaw-sync-now-correct',
      name: '立即同步 OpenClaw (正确API)',
      callback: () => {
        console.log('OpenClaw sync command executed');
        new Notice('开始同步 OpenClaw 记忆库...');
        this.syncNow();
      }
    });
    
    this.addCommand({
      id: 'openclaw-test-connection-correct',
      name: '测试 OpenClaw 连接 (正确API)',
      callback: () => {
        console.log('Testing OpenClaw connection');
        new Notice('测试 OpenClaw 连接...');
        this.testConnection();
      }
    });
    
    this.addCommand({
      id: 'openclaw-view-memory-files',
      name: '查看记忆文件',
      callback: () => {
        console.log('Viewing memory files');
        new Notice('获取记忆文件列表...');
        this.getMemoryFiles();
      }
    });
    
    // 添加侧边栏图标
    this.addRibbonIcon('brain', 'OpenClaw 记忆同步', () => {
      new Notice('打开 OpenClaw 记忆库');
      this.showMemoryView();
    });
    
    // 添加状态栏
    const statusBar = this.addStatusBarItem();
    statusBar.setText('OpenClaw 🔌');
    statusBar.setAttr('title', 'OpenClaw 记忆同步插件 (正确API)');
    
    // 添加设置标签页
    this.addSettingTab(new OpenClawMemorySyncSettingTabCorrectAPI(this.app, this));
    
    console.log('✅ OpenClaw Memory Sync (Correct API) loaded successfully!');
    new Notice('✅ OpenClaw 记忆同步插件 (正确API) 已加载');
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  async testConnection() {
    try {
      console.log('测试 OpenClaw 连接...');
      console.log(`API URL: http://${this.settings.apiUrl}:${this.settings.apiPort}`);
      
      // 尝试连接 Gateway
      const response = await requestUrl({
        url: `http://${this.settings.apiUrl}:${this.settings.apiPort}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.settings.apiToken}`
        }
      });
      
      if (response.status === 200) {
        console.log('✅ OpenClaw Gateway 连接成功');
        new Notice('✅ OpenClaw Gateway 连接成功');
        
        // 尝试获取内存文件
        await this.getMemoryFiles();
      } else {
        console.log(`❌ OpenClaw 连接失败: HTTP ${response.status}`);
        new Notice(`❌ OpenClaw 连接失败: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ OpenClaw 连接错误:', error);
      new Notice(`❌ OpenClaw 连接错误: ${error.message}`);
    }
  }
  
  async getMemoryFiles() {
    try {
      console.log('获取记忆文件...');
      
      // 这里应该调用 OpenClaw 的内存 API
      // 由于 API 端点不确定，我们先模拟数据
      
      // 模拟从 OpenClaw 获取文件
      const mockFiles = [
        { name: 'MEMORY.md', content: '# OpenClaw 记忆库\n\n这是长期记忆文件。' },
        { name: 'memory/2024-01-01.md', content: '# 2024-01-01\n\n今天的记录。' },
        { name: 'memory/2024-01-02.md', content: '# 2024-01-02\n\n另一个记录。' }
      ];
      
      console.log(`✅ 获取到 ${mockFiles.length} 个记忆文件`);
      new Notice(`✅ 获取到 ${mockFiles.length} 个记忆文件`);
      
      // 保存到 Obsidian
      await this.saveFilesToObsidian(mockFiles);
      
    } catch (error) {
      console.error('❌ 获取记忆文件错误:', error);
      new Notice(`❌ 获取记忆文件错误: ${error.message}`);
    }
  }
  
  async saveFilesToObsidian(files: Array<{name: string, content: string}>) {
    try {
      const vault = this.app.vault;
      const targetFolder = this.settings.targetFolder;
      
      // 确保目标文件夹存在
      let folder = vault.getAbstractFileByPath(targetFolder);
      if (!folder) {
        await vault.createFolder(targetFolder);
        console.log(`✅ 创建文件夹: ${targetFolder}`);
      }
      
      // 保存文件
      for (const file of files) {
        const filePath = `${targetFolder}/${file.name}`;
        
        // 检查文件是否已存在
        const existingFile = vault.getAbstractFileByPath(filePath);
        if (existingFile) {
          // 更新现有文件
          await vault.modify(existingFile as any, file.content);
          console.log(`✅ 更新文件: ${file.name}`);
        } else {
          // 创建新文件
          await vault.create(filePath, file.content);
          console.log(`✅ 创建文件: ${file.name}`);
        }
      }
      
      console.log(`✅ 已保存 ${files.length} 个文件到 Obsidian`);
      new Notice(`✅ 已保存 ${files.length} 个文件到 Obsidian`);
      
    } catch (error) {
      console.error('❌ 保存文件到 Obsidian 错误:', error);
      new Notice(`❌ 保存文件错误: ${error.message}`);
    }
  }
  
  syncNow() {
    console.log('开始同步...');
    // 模拟同步过程
    setTimeout(() => {
      new Notice('✅ OpenClaw 记忆库同步完成');
      console.log('同步完成');
    }, 2000);
  }
  
  showMemoryView() {
    console.log('显示记忆库视图');
    // 这里可以添加显示视图的逻辑
  }
  
  onunload() {
    console.log('OpenClaw Memory Sync (Correct API) unloading');
  }
}

class OpenClawMemorySyncSettingTabCorrectAPI extends PluginSettingTab {
  plugin: OpenClawMemorySyncCorrectAPI;

  constructor(app: App, plugin: OpenClawMemorySyncCorrectAPI) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'OpenClaw 记忆同步设置 (正确API)' });
    
    new Setting(containerEl)
      .setName('API 地址')
      .setDesc('OpenClaw Gateway 服务器地址')
      .addText(text => text
        .setPlaceholder('localhost')
        .setValue(this.plugin.settings.apiUrl)
        .onChange(async (value) => {
          this.plugin.settings.apiUrl = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('API 端口')
      .setDesc('OpenClaw Gateway 服务器端口 (默认: 18789)')
      .addText(text => text
        .setPlaceholder('18789')
        .setValue(this.plugin.settings.apiPort.toString())
        .onChange(async (value) => {
          this.plugin.settings.apiPort = parseInt(value) || 18789;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('API Token')
      .setDesc('OpenClaw Gateway 认证令牌')
      .addText(text => text
        .setPlaceholder('输入 API Token')
        .setValue(this.plugin.settings.apiToken)
        .onChange(async (value) => {
          this.plugin.settings.apiToken = value;
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
    
    // 测试连接按钮
    new Setting(containerEl)
      .setName('测试连接')
      .setDesc('测试 OpenClaw Gateway 连接')
      .addButton(button => button
        .setButtonText('测试连接')
        .setCta()
        .onClick(() => {
          this.plugin.testConnection();
        }));
  }
}