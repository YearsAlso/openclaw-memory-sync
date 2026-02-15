#!/usr/bin/env node

/**
 * 检查 Obsidian 插件加载错误的脚本
 */

console.log('🔍 检查 Obsidian 插件加载问题\n');

console.log('🎯 问题症状:');
console.log('1. Cmd+P 无法搜索到 OpenClaw 命令');
console.log('2. 界面上没有大脑图标 🧠');
console.log('3. 插件市场可以看到插件但没有设置按钮');
console.log('');

console.log('📋 诊断步骤:\n');

console.log('1. 🔄 重启 Obsidian 并检查开发者控制台:');
console.log('   - 完全退出 Obsidian (Cmd+Q)');
console.log('   - 重新打开 Obsidian');
console.log('   - 按 Cmd+Option+I 打开开发者工具');
console.log('   - 查看 Console 标签页');
console.log('   - 查找红色错误信息');
console.log('');

console.log('2. 🧪 测试简单插件:');
console.log('   - 我们创建了 "openclaw-simple" 插件');
console.log('   - 它应该出现在插件列表中');
console.log('   - 启用后应该有:');
console.log('     • 侧边栏大脑图标');
console.log('     • 命令: "OpenClaw Simple Test"');
console.log('     • 状态栏: "OpenClaw ✅"');
console.log('');

console.log('3. 🔍 检查原始插件问题:');
console.log('   如果简单插件工作但原始插件不工作，可能是:');
console.log('   - 代码语法错误');
console.log('   - 依赖问题');
console.log('   - API 兼容性问题');
console.log('');

console.log('4. 🛠️ 修复步骤:');
console.log('   A. 先测试简单插件:');
console.log('      1. 重启 Obsidian');
console.log('      2. 启用 "OpenClaw Simple"');
console.log('      3. 检查是否有图标和命令');
console.log('');
console.log('   B. 如果简单插件也不工作:');
console.log('      1. 查看开发者控制台错误');
console.log('      2. 可能是 Obsidian 版本问题');
console.log('      3. 尝试更新 Obsidian');
console.log('');
console.log('   C. 如果简单插件工作但原始插件不工作:');
console.log('      1. 原始插件代码需要修复');
console.log('      2. 可能是复杂的代码有错误');
console.log('      3. 需要简化原始插件');
console.log('');

console.log('5. 📝 需要你提供的信息:');
console.log('   - Obsidian 版本号 (帮助 → 关于 Obsidian)');
console.log('   - 开发者控制台中的完整错误信息');
console.log('   - 简单插件是否工作');
console.log('   - 操作系统版本');
console.log('');

console.log('6. 🚀 立即操作指南:');
console.log('   1. 完全退出 Obsidian');
console.log('   2. 重新打开 Obsidian');
console.log('   3. 打开开发者工具 (Cmd+Option+I)');
console.log('   4. 查看 Console 中的错误');
console.log('   5. 尝试启用 "OpenClaw Simple" 插件');
console.log('   6. 测试简单插件功能');
console.log('   7. 报告结果');
console.log('');

console.log('💡 提示:');
console.log('- 插件加载失败通常是因为代码错误');
console.log('- 开发者控制台会显示具体错误信息');
console.log('- 简单插件可以帮助隔离问题');
console.log('- 如果简单插件也不工作，可能是环境问题');