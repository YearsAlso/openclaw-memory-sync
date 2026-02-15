#!/usr/bin/env node

/**
 * Obsidian 插件加载问题诊断脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Obsidian 插件加载问题诊断\n');

const OBSIDIAN_VAULT = '/Volumes/MxStore/Project/YearsAlso';
const OBSIDIAN_DIR = path.join(OBSIDIAN_VAULT, '.obsidian');

console.log(`检查 Obsidian 仓库: ${OBSIDIAN_VAULT}`);
console.log(`.obsidian 目录: ${OBSIDIAN_DIR}\n`);

// 1. 检查基本目录结构
console.log('1. 📁 检查目录结构:');
if (!fs.existsSync(OBSIDIAN_VAULT)) {
  console.log('  ❌ Obsidian 仓库不存在');
  process.exit(1);
}
console.log('  ✅ Obsidian 仓库存在');

if (!fs.existsSync(OBSIDIAN_DIR)) {
  console.log('  ❌ .obsidian 目录不存在');
  process.exit(1);
}
console.log('  ✅ .obsidian 目录存在');

// 2. 检查插件目录
console.log('\n2. 🔌 检查插件目录:');
const pluginsDir = path.join(OBSIDIAN_DIR, 'plugins');
if (!fs.existsSync(pluginsDir)) {
  console.log('  ❌ plugins 目录不存在');
  process.exit(1);
}
console.log('  ✅ plugins 目录存在');

// 列出所有插件
const plugins = fs.readdirSync(pluginsDir).filter(p => 
  fs.statSync(path.join(pluginsDir, p)).isDirectory()
);
console.log(`  📋 找到 ${plugins.length} 个插件:`);
plugins.forEach(plugin => {
  const hasManifest = fs.existsSync(path.join(pluginsDir, plugin, 'manifest.json'));
  const hasMainJs = fs.existsSync(path.join(pluginsDir, plugin, 'main.js'));
  const status = hasManifest && hasMainJs ? '✅' : '❌';
  console.log(`    ${status} ${plugin}`);
});

// 3. 检查 OpenClaw 插件
console.log('\n3. 🧠 检查 OpenClaw Memory Sync 插件:');
const openclawDir = path.join(pluginsDir, 'openclaw-memory-sync');
if (!fs.existsSync(openclawDir)) {
  console.log('  ❌ openclaw-memory-sync 目录不存在');
} else {
  console.log('  ✅ openclaw-memory-sync 目录存在');
  
  const files = ['manifest.json', 'main.js', 'styles.css', 'data.json'];
  files.forEach(file => {
    const filePath = path.join(openclawDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`    ✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`    ❌ ${file} 不存在`);
    }
  });
  
  // 检查 manifest.json 内容
  const manifestPath = path.join(openclawDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`    📋 插件ID: ${manifest.id}`);
      console.log(`    📋 插件名称: ${manifest.name}`);
      console.log(`    📋 版本: ${manifest.version}`);
    } catch (error) {
      console.log(`    ❌ manifest.json 解析错误: ${error.message}`);
    }
  }
}

// 4. 检查社区插件列表
console.log('\n4. 📋 检查社区插件列表:');
const communityPluginsPath = path.join(OBSIDIAN_DIR, 'community-plugins.json');
if (!fs.existsSync(communityPluginsPath)) {
  console.log('  ❌ community-plugins.json 不存在');
} else {
  try {
    const pluginsList = JSON.parse(fs.readFileSync(communityPluginsPath, 'utf8'));
    console.log(`  ✅ community-plugins.json 有效，包含 ${pluginsList.length} 个插件`);
    
    // 检查我们的插件是否在列表中
    const targetPlugins = ['openclaw-memory-sync', 'test-plugin', 'simple-test'];
    targetPlugins.forEach(plugin => {
      if (pluginsList.includes(plugin)) {
        console.log(`    ✅ ${plugin} 在插件列表中`);
      } else {
        console.log(`    ❌ ${plugin} 不在插件列表中`);
      }
    });
    
    // 显示最后几个插件
    console.log(`    📊 最后5个插件: ${pluginsList.slice(-5).join(', ')}`);
    
  } catch (error) {
    console.log(`  ❌ community-plugins.json 解析错误: ${error.message}`);
  }
}

// 5. 检查核心插件配置
console.log('\n5. ⚙️ 检查核心插件配置:');
const corePluginsPath = path.join(OBSIDIAN_DIR, 'core-plugins.json');
if (!fs.existsSync(corePluginsPath)) {
  console.log('  ❌ core-plugins.json 不存在');
} else {
  try {
    const corePlugins = JSON.parse(fs.readFileSync(corePluginsPath, 'utf8'));
    console.log('  ✅ core-plugins.json 有效');
    
    // 检查关键插件是否启用
    const criticalPlugins = ['command-palette', 'file-explorer'];
    criticalPlugins.forEach(plugin => {
      if (corePlugins[plugin]) {
        console.log(`    ✅ ${plugin} 已启用`);
      } else {
        console.log(`    ⚠️  ${plugin} 未启用（可能影响插件功能）`);
      }
    });
    
  } catch (error) {
    console.log(`  ❌ core-plugins.json 解析错误: ${error.message}`);
  }
}

// 6. 检查 app.json 配置
console.log('\n6. 📱 检查 app.json 配置:');
const appConfigPath = path.join(OBSIDIAN_DIR, 'app.json');
if (!fs.existsSync(appConfigPath)) {
  console.log('  ❌ app.json 不存在');
} else {
  try {
    const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
    console.log('  ✅ app.json 有效');
    console.log(`    📊 配置项: ${Object.keys(appConfig).join(', ')}`);
  } catch (error) {
    console.log(`  ❌ app.json 解析错误: ${error.message}`);
  }
}

// 7. 检查文件权限
console.log('\n7. 🔒 检查文件权限:');
const checkPaths = [
  OBSIDIAN_DIR,
  pluginsDir,
  openclawDir,
  communityPluginsPath
];

checkPaths.forEach(checkPath => {
  if (fs.existsSync(checkPath)) {
    try {
      fs.accessSync(checkPath, fs.constants.R_OK);
      console.log(`    ✅ ${checkPath} 可读`);
    } catch (error) {
      console.log(`    ❌ ${checkPath} 不可读: ${error.message}`);
    }
  }
});

// 8. 创建诊断报告
console.log('\n8. 📊 创建诊断报告:');
const openclawFiles = ['manifest.json', 'main.js', 'styles.css', 'data.json'];
const report = {
  timestamp: new Date().toISOString(),
  vault: OBSIDIAN_VAULT,
  pluginsCount: plugins.length,
  openclawPlugin: {
    installed: fs.existsSync(openclawDir),
    files: openclawFiles.map(file => ({
      name: file,
      exists: fs.existsSync(path.join(openclawDir, file))
    }))
  },
  communityPlugins: {
    fileExists: fs.existsSync(communityPluginsPath),
    openclawInList: false
  }
};

// 检查插件是否在列表中
if (fs.existsSync(communityPluginsPath)) {
  try {
    const pluginsList = JSON.parse(fs.readFileSync(communityPluginsPath, 'utf8'));
    report.communityPlugins.openclawInList = pluginsList.includes('openclaw-memory-sync');
  } catch (error) {
    report.communityPlugins.parseError = error.message;
  }
}

const reportPath = path.join(__dirname, 'obsidian-diagnosis.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✅ 诊断报告已保存到: ${reportPath}`);

// 9. 提供解决方案
console.log('\n9. 🛠️ 建议的解决方案:');
console.log('\n如果插件在 Obsidian 中不可见，请尝试以下步骤:');
console.log('\nA. 基本检查:');
console.log('   1. 完全退出 Obsidian (Cmd+Q)');
console.log('   2. 等待 10 秒钟');
console.log('   3. 重新打开 Obsidian');
console.log('   4. 打开仓库: /Volumes/MxStore/Project/YearsAlso');
console.log('   5. 检查设置 → 社区插件');

console.log('\nB. 如果仍然看不到插件:');
console.log('   1. 在 Obsidian 中打开开发者工具 (Cmd+Option+I)');
console.log('   2. 查看 Console 标签页');
console.log('   3. 查找错误信息');
console.log('   4. 特别查找 "openclaw" 或 "plugin" 相关的错误');

console.log('\nC. 清理缓存:');
console.log('   1. 退出 Obsidian');
console.log('   2. 删除 workspace.json:');
console.log('      rm -rf "/Volumes/MxStore/Project/YearsAlso/.obsidian/workspace.json"');
console.log('   3. 重新启动 Obsidian');

console.log('\nD. 验证插件文件:');
console.log('   1. 检查插件文件权限:');
console.log('      ls -la "/Volumes/MxStore/Project/YearsAlso/.obsidian/plugins/openclaw-memory-sync/"');
console.log('   2. 确保所有文件可读:');
console.log('      chmod 644 "/Volumes/MxStore/Project/YearsAlso/.obsidian/plugins/openclaw-memory-sync/"*');

console.log('\nE. 测试简单插件:');
console.log('   1. 检查 simple-test 插件是否显示');
console.log('   2. 如果 simple-test 显示但 openclaw 不显示，可能是插件代码问题');
console.log('   3. 如果 simple-test 也不显示，可能是 Obsidian 配置问题');

console.log('\n📞 如需进一步帮助，请提供:');
console.log('   - Obsidian 版本');
console.log('   - 操作系统版本');
console.log('   - 开发者控制台中的错误信息');
console.log('   - 诊断报告文件: obsidian-diagnosis.json');

console.log('\n🎯 当前状态总结:');
if (fs.existsSync(openclawDir)) {
  console.log('✅ OpenClaw 插件文件已安装');
  console.log('✅ 请按照上述步骤进行故障排除');
} else {
  console.log('❌ OpenClaw 插件文件未安装');
  console.log('❌ 请重新安装插件');
}