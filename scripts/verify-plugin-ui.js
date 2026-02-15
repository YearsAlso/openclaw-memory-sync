#!/usr/bin/env node

/**
 * 验证 OpenClaw 插件 UI 功能的脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 OpenClaw 插件 UI 功能\n');

const OBSIDIAN_VAULT = '/Volumes/MxStore/Project/YearsAlso';
const PLUGIN_DIR = path.join(OBSIDIAN_VAULT, '.obsidian', 'plugins', 'openclaw-memory-sync');

console.log('🎯 插件访问方法指南:\n');

// 1. 命令面板方法
console.log('1. 📝 命令面板访问 (最可靠):');
console.log('   - 按 Cmd+P (macOS) 或 Ctrl+P (Windows/Linux)');
console.log('   - 输入 "OpenClaw"');
console.log('   - 可用命令:');
console.log('     • OpenClaw: 立即同步');
console.log('     • OpenClaw: 查看记忆库');
console.log('     • OpenClaw: 查看同步状态');
console.log('     • OpenClaw: 打开设置');
console.log('');

// 2. 设置页面方法
console.log('2. ⚙️ 设置页面访问:');
console.log('   - 点击左下角设置按钮 ⚙️');
console.log('   - 选择"社区插件"');
console.log('   - 找到 "OpenClaw Memory Sync"');
console.log('   - 确保开关为蓝色（已启用）');
console.log('   - 点击"设置"按钮配置插件');
console.log('');

// 3. 侧边栏图标
console.log('3. 🧠 侧边栏图标:');
console.log('   - 位置: 左侧侧边栏');
console.log('   - 图标: 大脑图标 🧠');
console.log('   - 如果看不到图标，可能因为:');
console.log('     • 侧边栏被隐藏');
console.log('     • 图标被挤到下面');
console.log('     • 需要滚动侧边栏');
console.log('');

// 4. 状态栏图标
console.log('4. 📊 状态栏图标:');
console.log('   - 位置: 窗口底部状态栏（右下角）');
console.log('   - 图标: 🔄 (同步中) 或 ✅ (空闲)');
console.log('   - 点击可以查看同步状态');
console.log('');

// 5. 验证插件文件
console.log('5. 📁 验证插件文件:');
const files = ['manifest.json', 'main.js', 'styles.css', 'data.json'];
files.forEach(file => {
  const filePath = path.join(PLUGIN_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`   ❌ ${file} 不存在`);
  }
});

// 6. 检查插件配置
console.log('\n6. ⚙️ 插件配置:');
const configPath = path.join(PLUGIN_DIR, 'data.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('   ✅ 配置文件有效');
    console.log(`   📋 目标文件夹: ${config.targetFolder}`);
    
    // 检查目标文件夹
    const targetFolder = path.join(OBSIDIAN_VAULT, config.targetFolder);
    if (fs.existsSync(targetFolder)) {
      const files = fs.readdirSync(targetFolder).filter(f => f.endsWith('.md'));
      console.log(`   📄 目标文件夹包含 ${files.length} 个记忆文件`);
    }
  } catch (error) {
    console.log(`   ❌ 配置文件错误: ${error.message}`);
  }
}

// 7. 创建测试指南
console.log('\n7. 🧪 测试指南:');
console.log('   A. 首先使用命令面板:');
console.log('      1. Cmd+P → 输入 "OpenClaw: 查看记忆库"');
console.log('      2. 应该能看到记忆文件列表');
console.log('');
console.log('   B. 然后测试同步功能:');
console.log('      1. Cmd+P → 输入 "OpenClaw: 立即同步"');
console.log('      2. 观察同步状态');
console.log('');
console.log('   C. 最后检查设置:');
console.log('      1. Cmd+P → 输入 "OpenClaw: 打开设置"');
console.log('      2. 配置 API 连接（如果需要）');
console.log('');

// 8. 故障排除
console.log('8. 🐛 故障排除:');
console.log('   如果仍然找不到插件:');
console.log('   - 重启 Obsidian (完全退出再打开)');
console.log('   - 检查开发者控制台 (Cmd+Option+I)');
console.log('   - 查看 Console 中的错误信息');
console.log('   - 搜索 "openclaw" 相关的错误');
console.log('');

// 9. 创建快捷键建议
console.log('9. ⌨️ 快捷键建议:');
console.log('   为方便使用，可以设置快捷键:');
console.log('   - 打开设置 → 快捷键');
console.log('   - 搜索 "OpenClaw"');
console.log('   - 建议快捷键:');
console.log('     • Cmd+Shift+O: 打开记忆库');
console.log('     • Cmd+Shift+S: 立即同步');
console.log('     • Cmd+Shift+P: 同步状态');
console.log('');

// 10. 验证插件功能
console.log('10. ✅ 功能验证清单:');
console.log('    [ ] 命令面板能找到 OpenClaw 命令');
console.log('    [ ] 可以打开记忆库视图');
console.log('    [ ] 可以查看同步状态');
console.log('    [ ] 可以打开设置页面');
console.log('    [ ] 侧边栏显示大脑图标（可选）');
console.log('    [ ] 状态栏显示同步状态（可选）');
console.log('');

console.log('🎉 现在请尝试使用命令面板访问 OpenClaw 插件！');
console.log('💡 提示: 命令面板是最可靠的访问方式，图标可能被隐藏或需要滚动才能看到。');