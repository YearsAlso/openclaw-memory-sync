import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder, requestUrl } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';

interface OpenClawMemorySyncSettings {
  openclawWorkspacePath: string;
  targetFolder: string;
  syncMode: 'auto' | 'manual';
  includePatterns: string[];
  excludePatterns: string[];
}

const DEFAULT_SETTINGS: OpenClawMemorySyncSettings = {
  openclawWorkspacePath: '/Users/mengxiang/.openclaw/workspace',
  targetFolder: 'OpenClaw记忆库',
  syncMode: 'manual',
  includePatterns: ['*.md', 'memory/*.md'],
  excludePatterns: ['node_modules/**', '.git/**']
};

export default class OpenClawMemorySyncReal extends Plugin {
  settings: OpenClawMemorySyncSettings;

  async onload() {
    console.log('🧠 OpenClaw Memory Sync (真实记忆) loading...');
    
    await this.loadSettings();
    
    // 验证 OpenClaw 工作空间路径
    await this.validateOpenClawWorkspace();
    
    // 添加命令
    this.addCommand({
      id: 'openclaw-sync-real-memory',
      name: '同步真实 OpenClaw 记忆',
      callback: () => {
        console.log('开始同步真实记忆文件');
        new Notice('开始同步 OpenClaw 真实记忆...');
        this.syncRealMemory();
      }
    });
    
    this.addCommand({
      id: 'openclaw-list-memory-files',
      name: '列出 OpenClaw 记忆文件',
      callback: () => {
        console.log('列出记忆文件');
        new Notice('列出 OpenClaw 记忆文件...');
        this.listMemoryFiles();
      }
    });
    
    this.addCommand({
      id: 'openclaw-view-latest-memory',
      name: '查看最新记忆',
      callback: () => {
        console.log('查看最新记忆');
        new Notice('打开最新记忆文件...');
        this.viewLatestMemory();
      }
    });
    
    this.addCommand({
      id: 'openclaw-check-workspace',
      name: '检查 OpenClaw 工作空间',
      callback: () => {
        console.log('检查工作空间');
        this.checkOpenClawWorkspace();
      }
    });
    
    // 添加侧边栏图标
    this.addRibbonIcon('brain', 'OpenClaw 真实记忆同步', () => {
      new Notice('开始同步 OpenClaw 真实记忆');
      this.syncRealMemory();
    });
    
    // 添加状态栏
    const statusBar = this.addStatusBarItem();
    statusBar.setText('OpenClaw 🧠');
    statusBar.setAttr('title', 'OpenClaw 真实记忆同步插件');
    
    // 添加设置标签页
    this.addSettingTab(new OpenClawMemorySyncSettingTabReal(this.app, this));
    
    console.log('✅ OpenClaw Memory Sync (真实记忆) loaded successfully!');
    new Notice('✅ OpenClaw 真实记忆同步插件已加载');
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  async validateOpenClawWorkspace() {
    try {
      const workspacePath = this.settings.openclawWorkspacePath;
      console.log(`验证 OpenClaw 工作空间路径: ${workspacePath}`);
      
      if (!fs.existsSync(workspacePath)) {
        console.error(`❌ OpenClaw 工作空间不存在: ${workspacePath}`);
        new Notice(`❌ OpenClaw 工作空间不存在: ${workspacePath}`);
        return false;
      }
      
      // 检查 memory 文件夹
      const memoryPath = path.join(workspacePath, 'memory');
      if (!fs.existsSync(memoryPath)) {
        console.warn(`⚠️ memory 文件夹不存在: ${memoryPath}`);
        new Notice(`⚠️ memory 文件夹不存在，将创建`);
      } else {
        console.log(`✅ memory 文件夹存在: ${memoryPath}`);
      }
      
      // 检查 MEMORY.md 文件
      const memoryFile = path.join(workspacePath, 'MEMORY.md');
      if (!fs.existsSync(memoryFile)) {
        console.warn(`⚠️ MEMORY.md 文件不存在: ${memoryFile}`);
      } else {
        console.log(`✅ MEMORY.md 文件存在: ${memoryFile}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ 验证工作空间错误:', error);
      new Notice(`❌ 验证工作空间错误: ${error.message}`);
      return false;
    }
  }
  
  async checkOpenClawWorkspace() {
    try {
      const workspacePath = this.settings.openclawWorkspacePath;
      console.log(`=== 检查 OpenClaw 工作空间 ===`);
      console.log(`工作空间路径: ${workspacePath}`);
      
      if (!fs.existsSync(workspacePath)) {
        console.log(`❌ 工作空间不存在`);
        new Notice(`❌ OpenClaw 工作空间不存在`);
        return;
      }
      
      // 列出工作空间内容
      const items = fs.readdirSync(workspacePath);
      console.log(`工作空间项目数量: ${items.length}`);
      console.log('前10个项目:', items.slice(0, 10).join(', '));
      
      // 检查 memory 文件夹
      const memoryPath = path.join(workspacePath, 'memory');
      if (fs.existsSync(memoryPath)) {
        const memoryFiles = fs.readdirSync(memoryPath).filter(f => f.endsWith('.md'));
        console.log(`memory 文件夹中的 .md 文件数量: ${memoryFiles.length}`);
        console.log('记忆文件:', memoryFiles.slice(0, 10).join(', '));
        
        // 显示最新文件
        if (memoryFiles.length > 0) {
          memoryFiles.sort().reverse();
          const latestFile = memoryFiles[0];
          const latestFilePath = path.join(memoryPath, latestFile);
          const stats = fs.statSync(latestFilePath);
          console.log(`最新记忆文件: ${latestFile}`);
          console.log(`最后修改时间: ${new Date(stats.mtime).toLocaleString('zh-CN')}`);
          console.log(`文件大小: ${stats.size} 字节`);
          
          // 读取文件前几行
          const content = fs.readFileSync(latestFilePath, 'utf8').split('\n').slice(0, 5).join('\n');
          console.log(`文件开头:\n${content}`);
        }
      } else {
        console.log(`❌ memory 文件夹不存在: ${memoryPath}`);
      }
      
      // 检查 MEMORY.md
      const memoryFile = path.join(workspacePath, 'MEMORY.md');
      if (fs.existsSync(memoryFile)) {
        const stats = fs.statSync(memoryFile);
        console.log(`✅ MEMORY.md 存在，大小: ${stats.size} 字节`);
      } else {
        console.log(`❌ MEMORY.md 不存在: ${memoryFile}`);
      }
      
      console.log('=== 检查完成 ===');
      new Notice('✅ OpenClaw 工作空间检查完成');
      
    } catch (error) {
      console.error('❌ 检查工作空间错误:', error);
      new Notice(`❌ 检查工作空间错误: ${error.message}`);
    }
  }
  
  async listMemoryFiles() {
    try {
      const memoryPath = path.join(this.settings.openclawWorkspacePath, 'memory');
      
      if (!fs.existsSync(memoryPath)) {
        console.log(`memory 文件夹不存在: ${memoryPath}`);
        new Notice('memory 文件夹不存在');
        return;
      }
      
      const files = fs.readdirSync(memoryPath)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
      
      console.log(`找到 ${files.length} 个记忆文件:`);
      files.forEach((file, index) => {
        const filePath = path.join(memoryPath, file);
        const stats = fs.statSync(filePath);
        console.log(`${index + 1}. ${file} (${new Date(stats.mtime).toLocaleDateString('zh-CN')}, ${stats.size} 字节)`);
      });
      
      new Notice(`找到 ${files.length} 个记忆文件`);
      
    } catch (error) {
      console.error('❌ 列出记忆文件错误:', error);
      new Notice(`❌ 列出记忆文件错误: ${error.message}`);
    }
  }
  
  async syncRealMemory() {
    try {
      console.log('开始同步真实记忆...');
      new Notice('开始同步真实记忆文件...');
      
      const workspacePath = this.settings.openclawWorkspacePath;
      const targetFolder = this.settings.targetFolder;
      
      // 1. 同步 MEMORY.md
      await this.syncMemoryFile(workspacePath, 'MEMORY.md', targetFolder);
      
      // 2. 同步 memory 文件夹中的文件
      const memoryPath = path.join(workspacePath, 'memory');
      if (fs.existsSync(memoryPath)) {
        const memoryFiles = fs.readdirSync(memoryPath)
          .filter(f => f.endsWith('.md'))
          .sort()
          .reverse()
          .slice(0, 30); // 只同步最近30个文件
        
        console.log(`同步 ${memoryFiles.length} 个记忆文件`);
        
        for (const file of memoryFiles) {
          await this.syncMemoryFile(memoryPath, file, `${targetFolder}/memory`);
        }
      }
      
      console.log('✅ 真实记忆同步完成');
      new Notice('✅ OpenClaw 真实记忆同步完成');
      
    } catch (error) {
      console.error('❌ 同步真实记忆错误:', error);
      new Notice(`❌ 同步错误: ${error.message}`);
    }
  }
  
  async syncMemoryFile(sourceDir: string, fileName: string, targetFolder: string) {
    try {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = `${targetFolder}/${fileName}`;
      
      console.log(`同步文件: ${sourcePath} -> ${targetPath}`);
      
      // 读取源文件内容
      const content = fs.readFileSync(sourcePath, 'utf8');
      
      // 确保目标文件夹存在
      const vault = this.app.vault;
      let folder = vault.getAbstractFileByPath(targetFolder);
      if (!folder) {
        console.log(`创建文件夹: ${targetFolder}`);
        await vault.createFolder(targetFolder);
      }
      
      // 检查是否需要创建父文件夹
      const pathParts = fileName.split('/');
      if (pathParts.length > 1) {
        const folderPath = `${targetFolder}/${pathParts.slice(0, -1).join('/')}`;
        const parentFolder = vault.getAbstractFileByPath(folderPath);
        if (!parentFolder) {
          console.log(`创建父文件夹: ${folderPath}`);
          await vault.createFolder(folderPath);
        }
      }
      
      // 保存到 Obsidian
      const existingFile = vault.getAbstractFileByPath(targetPath);
      if (existingFile) {
        // 更新现有文件
        await vault.modify(existingFile as any, content);
        console.log(`✅ 更新文件: ${fileName}`);
      } else {
        // 创建新文件
        await vault.create(targetPath, content);
        console.log(`✅ 创建文件: ${fileName}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`❌ 同步文件 ${fileName} 错误:`, error);
      return false;
    }
  }
  
  async viewLatestMemory() {
    try {
      const memoryPath = path.join(this.settings.openclawWorkspacePath, 'memory');
      
      if (!fs.existsSync(memoryPath)) {
        new Notice('memory 文件夹不存在');
        return;
      }
      
      const files = fs.readdirSync(memoryPath)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        new Notice('没有找到记忆文件');
        return;
      }
      
      const latestFile = files[0];
      const targetPath = `${this.settings.targetFolder}/memory/${latestFile}`;
      
      // 打开文件
      const file = this.app.vault.getAbstractFileByPath(targetPath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file as TFile);
        new Notice(`已打开最新记忆: ${latestFile}`);
      } else {
        new Notice(`文件不存在: ${latestFile}`);
      }
      
    } catch (error) {
      console.error('❌ 查看最新记忆错误:', error);
      new Notice(`❌ 查看最新记忆错误: ${error.message}`);
    }
  }
  
  onunload() {
    console.log('OpenClaw Memory Sync (真实记忆) unloading');
  }
}

class OpenClawMemorySyncSettingTabReal extends PluginSettingTab {
  plugin: OpenClawMemorySyncReal;

  constructor(app: App, plugin: OpenClawMemorySyncReal) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'OpenClaw 真实记忆同步设置' });
    
    new Setting(containerEl)
      .setName('OpenClaw 工作空间路径')
      .setDesc('OpenClaw 工作空间的绝对路径')
      .addText(text => text
        .setPlaceholder('/Users/mengxiang/.openclaw/workspace')
        .setValue(this.plugin.settings.openclawWorkspacePath)
        .onChange(async (value) => {
          this.plugin.settings.openclawWorkspacePath = value;
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
      .setName('同步模式')
      .setDesc('自动或手动同步')
      .addDropdown(dropdown => dropdown
        .addOption('manual', '手动')
        .addOption('auto', '自动')
        .setValue(this.plugin.settings.syncMode)
        .onChange(async (value: 'auto' | 'manual') => {
          this.plugin.settings.syncMode = value;
          await this.plugin.saveSettings();
        }));
    
    // 工作空间检查按钮
    new Setting(containerEl)
      .setName('检查工作空间')
      .setDesc('验证 OpenClaw 工作空间配置')
      .addButton(button => button
        .setButtonText('检查')
        .setCta()
        .onClick(() => {
          this.plugin.checkOpenClawWorkspace();
        }));
    
    // 立即同步按钮
    new Setting(containerEl)
      .setName('立即同步')
      .setDesc('立即同步所有记忆文件')
      .addButton(button => button
        .setButtonText('同步')
        .setCta()
        .onClick(() => {
          this.plugin.syncRealMemory();
        }));
  }
}