#!/usr/bin/env node

/**
 * 测试 Obsidian 插件安装状态的脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 测试 Obsidian 插件安装状态\n');

const OBSIDIAN_VAULT = '/Volumes/MxStore/Project/YearsAlso';
const PLUGIN_DIR = path.join(OBSIDIAN_VAULT, '.obsidian', 'plugins', 'openclaw-memory-sync');

console.log(`检查 Obsidian 仓库: ${OBSIDIAN_VAULT}`);
console.log(`插件目录: ${PLUGIN_DIR}\n`);

// 检查 Obsidian 仓库是否存在
if (!fs.existsSync(OBSIDIAN_VAULT)) {
  console.log(`❌ Obsidian 仓库不存在: ${OBSIDIAN_VAULT}`);
  process.exit(1);
}

console.log('✅ Obsidian 仓库存在');

// 检查 .obsidian 目录
const obsidianDir = path.join(OBSIDIAN_VAULT, '.obsidian');
if (!fs.existsSync(obsidianDir)) {
  console.log('❌ .obsidian 目录不存在');
  process.exit(1);
}

console.log('✅ .obsidian 目录存在');

// 检查插件目录
if (!fs.existsSync(PLUGIN_DIR)) {
  console.log('❌ 插件目录不存在');
  process.exit(1);
}

console.log('✅ 插件目录存在');

// 检查插件文件
console.log('\n📁 检查插件文件:');
const requiredPluginFiles = ['manifest.json', 'main.js', 'styles.css'];
let pluginFilesComplete = true;

for (const file of requiredPluginFiles) {
  const filePath = path.join(PLUGIN_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} 不存在`);
    pluginFilesComplete = false;
  }
}

// 检查配置文件
console.log('\n⚙️ 检查配置文件:');
const configFile = path.join(PLUGIN_DIR, 'data.json');
if (fs.existsSync(configFile)) {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    console.log('  ✅ data.json 配置文件存在');
    console.log(`  📋 配置内容:`);
    console.log(`    - API服务器: ${config.apiUrl}:${config.apiPort}`);
    console.log(`    - 目标文件夹: ${config.targetFolder}`);
    console.log(`    - 同步间隔: ${config.syncInterval}秒`);
    console.log(`    - 自动同步: ${config.autoSync ? '是' : '否'}`);
  } catch (error) {
    console.log(`  ❌ data.json 解析错误: ${error.message}`);
  }
} else {
  console.log('  ⚠️  data.json 配置文件不存在（插件首次运行时会创建）');
}

// 检查社区插件列表
console.log('\n📋 检查社区插件列表:');
const communityPluginsFile = path.join(obsidianDir, 'community-plugins.json');
if (fs.existsSync(communityPluginsFile)) {
  try {
    const plugins = JSON.parse(fs.readFileSync(communityPluginsFile, 'utf8'));
    if (Array.isArray(plugins) && plugins.includes('openclaw-memory-sync')) {
      console.log('  ✅ openclaw-memory-sync 已在插件列表中');
    } else {
      console.log('  ❌ openclaw-memory-sync 不在插件列表中');
      console.log('  ℹ️  当前插件列表:', plugins.slice(-5));
    }
  } catch (error) {
    console.log(`  ❌ community-plugins.json 解析错误: ${error.message}`);
  }
} else {
  console.log('  ❌ community-plugins.json 不存在');
}

// 检查目标文件夹
console.log('\n📂 检查目标文件夹:');
const targetFolder = path.join(OBSIDIAN_VAULT, 'OpenClaw记忆库');
if (fs.existsSync(targetFolder)) {
  console.log('  ✅ 目标文件夹存在: OpenClaw记忆库');
  
  // 列出文件夹内容
  const files = fs.readdirSync(targetFolder).filter(f => f.endsWith('.md'));
  console.log(`  📄 包含 ${files.length} 个 Markdown 文件:`);
  files.slice(0, 5).forEach(file => {
    const filePath = path.join(targetFolder, file);
    const stats = fs.statSync(filePath);
    console.log(`    - ${file} (${stats.size} bytes)`);
  });
  
  if (files.length > 5) {
    console.log(`    ... 还有 ${files.length - 5} 个文件`);
  }
} else {
  console.log('  ⚠️  目标文件夹不存在: OpenClaw记忆库');
  console.log('  ℹ️  插件将在首次运行时创建此文件夹');
}

// 检查插件功能
console.log('\n🔧 检查插件功能文件:');
const pluginSourceDir = '/Users/mengxiang/.openclaw/workspace/openclaw-memory-sync';
const sourceFiles = ['main.ts', 'api-client.ts', 'sync-engine.ts', 'src/utils/logger.ts'];

for (const file of sourceFiles) {
  const filePath = path.join(pluginSourceDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} 不存在`);
  }
}

// 验证插件 manifest
console.log('\n📦 验证插件 manifest:');
const manifestPath = path.join(PLUGIN_DIR, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    console.log('  ✅ manifest.json 有效');
    console.log(`  📋 插件信息:`);
    console.log(`    - 名称: ${manifest.name}`);
    console.log(`    - 版本: ${manifest.version}`);
    console.log(`    - 作者: ${manifest.author}`);
    console.log(`    - 描述: ${manifest.description}`);
    
    // 检查版本格式
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (versionRegex.test(manifest.version)) {
      console.log(`    - ✅ 版本号格式正确`);
    } else {
      console.log(`    - ❌ 版本号格式错误: ${manifest.version}`);
    }
    
  } catch (error) {
    console.log(`  ❌ manifest.json 解析错误: ${error.message}`);
  }
}

// 创建测试说明
console.log('\n🚀 测试说明:');
console.log('1. 重启 Obsidian 应用程序');
console.log('2. 打开仓库: /Volumes/MxStore/Project/YearsAlso');
console.log('3. 启用插件: 设置 → 社区插件 → 找到 "OpenClaw Memory Sync" → 启用');
console.log('4. 配置插件: 点击设置按钮配置 API 连接');
console.log('5. 测试功能:');
console.log('   - 点击侧边栏大脑图标 🧠');
console.log('   - 使用命令面板搜索 "OpenClaw"');
console.log('   - 测试同步功能');

// 总结
console.log('\n📊 安装测试总结:');
if (pluginFilesComplete) {
  console.log('✅ 插件文件安装完整');
  console.log('✅ 可以重启 Obsidian 测试插件');
  console.log('\n🎉 安装成功！请按照上述说明测试插件功能。');
} else {
  console.log('❌ 插件文件不完整');
  console.log('❌ 请检查并重新安装插件');
  process.exit(1);
}

console.log('\n💡 提示:');
console.log('- 如果 OpenClaw API 服务器未运行，插件会显示连接错误');
console.log('- 这是正常的，可以在插件设置中配置 API 连接');
console.log('- 插件首次运行时会创建必要的配置文件和文件夹');