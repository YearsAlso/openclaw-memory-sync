#!/usr/bin/env node

/**
 * 测试插件格式的脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 测试插件格式\n');

const OBSIDIAN_VAULT = '/Volumes/MxStore/Project/YearsAlso';
const PLUGINS_DIR = path.join(OBSIDIAN_VAULT, '.obsidian', 'plugins');

console.log('🎯 测试步骤:\n');

// 1. 列出所有插件
console.log('1. 📋 列出所有插件:');
const plugins = fs.readdirSync(PLUGINS_DIR).filter(p => 
  fs.statSync(path.join(PLUGINS_DIR, p)).isDirectory()
);

console.log(`   找到 ${plugins.length} 个插件`);
console.log('   前10个插件:', plugins.slice(0, 10).join(', '));

// 2. 检查成功的插件格式
console.log('\n2. ✅ 检查成功的插件格式:');
const successfulPlugins = ['obsidian-git', 'calendar', 'dataview'];
successfulPlugins.forEach(plugin => {
  const pluginDir = path.join(PLUGINS_DIR, plugin);
  if (fs.existsSync(pluginDir)) {
    console.log(`   📁 ${plugin}:`);
    
    // 检查 main.js
    const mainJs = path.join(pluginDir, 'main.js');
    if (fs.existsSync(mainJs)) {
      const stats = fs.statSync(mainJs);
      const content = fs.readFileSync(mainJs, 'utf8').substring(0, 500);
      console.log(`     ✅ main.js (${stats.size} bytes)`);
      console.log(`     📄 开头: ${content.substring(0, 100)}...`);
    }
    
    // 检查 manifest.json
    const manifest = path.join(pluginDir, 'manifest.json');
    if (fs.existsSync(manifest)) {
      try {
        const manifestContent = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        console.log(`     ✅ manifest.json: ${manifestContent.id}`);
      } catch (error) {
        console.log(`     ❌ manifest.json 解析错误: ${error.message}`);
      }
    }
  }
});

// 3. 检查我们的插件
console.log('\n3. 🧠 检查我们的插件:');
const ourPlugins = [
  'openclaw-memory-sync',
  'openclaw-simple',
  'openclaw-minimal',
  'openclaw-correct',
  'obsidian-version-test'
];

ourPlugins.forEach(plugin => {
  const pluginDir = path.join(PLUGINS_DIR, plugin);
  if (fs.existsSync(pluginDir)) {
    console.log(`   📁 ${plugin}:`);
    
    // 检查文件
    const files = ['manifest.json', 'main.js'];
    files.forEach(file => {
      const filePath = path.join(pluginDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`     ✅ ${file} (${stats.size} bytes)`);
        
        // 检查 main.js 内容
        if (file === 'main.js') {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          console.log(`     📄 行数: ${lines.length}`);
          console.log(`     📄 开头: ${lines[0].substring(0, 80)}...`);
          
          // 检查导出格式
          if (content.includes('module.exports')) {
            console.log(`     ✅ 使用 module.exports`);
          } else if (content.includes('export default')) {
            console.log(`     ⚠️  使用 export default (可能需要编译)`);
          } else {
            console.log(`     ❌ 没有找到导出语句`);
          }
        }
      } else {
        console.log(`     ❌ ${file} 不存在`);
      }
    });
  } else {
    console.log(`   ❌ ${plugin} 目录不存在`);
  }
});

// 4. 创建正确的插件格式
console.log('\n4. 🛠️ 创建正确的插件格式:');
console.log('   正确的插件应该:');
console.log('   - 使用 CommonJS 格式 (module.exports)');
console.log('   - 导出一个类或对象');
console.log('   - 包含 onload 和 onunload 方法');
console.log('   - manifest.json 格式正确');

// 5. 验证插件清单
console.log('\n5. 📋 验证插件清单:');
const communityPluginsPath = path.join(OBSIDIAN_VAULT, '.obsidian', 'community-plugins.json');
if (fs.existsSync(communityPluginsPath)) {
  try {
    const pluginsList = JSON.parse(fs.readFileSync(communityPluginsPath, 'utf8'));
    console.log(`   ✅ community-plugins.json 有效，包含 ${pluginsList.length} 个插件`);
    
    // 检查我们的插件是否在列表中
    ourPlugins.forEach(plugin => {
      if (pluginsList.includes(plugin)) {
        console.log(`     ✅ ${plugin} 在插件列表中`);
      } else {
        console.log(`     ❌ ${plugin} 不在插件列表中`);
      }
    });
  } catch (error) {
    console.log(`   ❌ community-plugins.json 解析错误: ${error.message}`);
  }
}

// 6. 建议的解决方案
console.log('\n6. 🚀 建议的解决方案:');
console.log('   A. 使用 "openclaw-correct" 插件格式');
console.log('   B. 确保使用 CommonJS (module.exports)');
console.log('   C. 检查 manifest.json 格式');
console.log('   D. 重启 Obsidian 并检查开发者控制台');

console.log('\n💡 提示:');
console.log('- Obsidian 1.11 可能对插件格式有严格要求');
console.log('- 模仿成功的插件格式 (如 obsidian-git)');
console.log('- 使用最简单的代码开始测试');