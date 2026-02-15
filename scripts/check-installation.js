#!/usr/bin/env node

/**
 * 检查插件安装状态的脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 OpenClaw Memory Sync 插件安装状态\n');

// 检查项目文件
console.log('📁 检查项目文件:');

const requiredFiles = [
  'manifest.json',
  'main.ts',
  'main.js',
  'styles.css',
  'package.json',
  'README.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} 不存在`);
    allFilesExist = false;
  }
}

// 检查构建产物
console.log('\n🔧 检查构建产物:');
const buildFiles = ['main.js', 'styles.css', 'manifest.json'];
for (const file of buildFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`  ✅ ${file} - ${content.length} 字符`);
  } else {
    console.log(`  ❌ ${file} 不存在`);
  }
}

// 检查依赖
console.log('\n📦 检查依赖:');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ node_modules 目录存在');
  
  // 检查关键依赖
  const keyDeps = ['obsidian', 'typescript', 'esbuild'];
  for (const dep of keyDeps) {
    const depPath = path.join('node_modules', dep);
    if (fs.existsSync(depPath)) {
      console.log(`  ✅ ${dep} 已安装`);
    } else {
      console.log(`  ⚠️  ${dep} 未安装`);
    }
  }
} else {
  console.log('  ❌ node_modules 目录不存在，请运行 npm install');
}

// 检查 TypeScript 配置
console.log('\n📝 检查 TypeScript 配置:');
if (fs.existsSync('tsconfig.json')) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log('  ✅ tsconfig.json 有效');
    
    if (tsconfig.compilerOptions?.strict) {
      console.log('  ✅ 严格模式已启用');
    }
  } catch (error) {
    console.log(`  ❌ tsconfig.json 解析错误: ${error.message}`);
  }
} else {
  console.log('  ❌ tsconfig.json 不存在');
}

// 检查 manifest.json
console.log('\n📋 检查 manifest.json:');
if (fs.existsSync('manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    const requiredFields = [
      'id', 'name', 'version', 'minAppVersion', 'description', 'author'
    ];
    
    for (const field of requiredFields) {
      if (manifest[field]) {
        console.log(`  ✅ ${field}: ${manifest[field]}`);
      } else {
        console.log(`  ❌ 缺少必需字段: ${field}`);
      }
    }
    
    // 检查版本格式
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (versionRegex.test(manifest.version)) {
      console.log(`  ✅ 版本号格式正确: ${manifest.version}`);
    } else {
      console.log(`  ❌ 版本号格式错误: ${manifest.version}`);
    }
    
  } catch (error) {
    console.log(`  ❌ manifest.json 解析错误: ${error.message}`);
  }
}

// 检查构建命令
console.log('\n⚙️ 检查构建命令:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['build', 'dev', 'test'];
  for (const script of requiredScripts) {
    if (scripts[script]) {
      console.log(`  ✅ ${script}: ${scripts[script]}`);
    } else {
      console.log(`  ⚠️  缺少脚本: ${script}`);
    }
  }
} catch (error) {
  console.log(`  ❌ package.json 解析错误: ${error.message}`);
}

// 模拟 Obsidian 安装
console.log('\n🏠 模拟 Obsidian 安装:');
const obsidianPluginDir = path.join(process.env.HOME || '', 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents', 'TestVault', '.obsidian', 'plugins', 'openclaw-memory-sync');

console.log(`检查路径: ${obsidianPluginDir}`);

if (fs.existsSync(obsidianPluginDir)) {
  console.log('  ✅ Obsidian 插件目录存在');
  
  const pluginFiles = ['manifest.json', 'main.js', 'styles.css'];
  let pluginComplete = true;
  
  for (const file of pluginFiles) {
    const filePath = path.join(obsidianPluginDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} 已安装`);
    } else {
      console.log(`  ❌ ${file} 未安装`);
      pluginComplete = false;
    }
  }
  
  if (pluginComplete) {
    console.log('  🎉 插件已完全安装到 Obsidian');
  } else {
    console.log('  ⚠️  插件安装不完整');
  }
} else {
  console.log('  ℹ️  Obsidian 插件目录不存在（正常，如果是首次安装）');
}

// 创建安装指南
console.log('\n📋 安装指南:');
console.log('1. 构建插件: npm run build');
console.log('2. 复制文件到 Obsidian 插件目录:');
console.log('   cp manifest.json main.js styles.css ~/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/你的仓库/.obsidian/plugins/openclaw-memory-sync/');
console.log('3. 重启 Obsidian');
console.log('4. 启用插件: 设置 → 社区插件 → OpenClaw Memory Sync');

// 总结
console.log('\n📊 安装状态总结:');
if (allFilesExist) {
  console.log('✅ 所有必需文件都存在');
  console.log('✅ 项目结构完整');
  console.log('✅ 可以开始开发和部署');
} else {
  console.log('❌ 缺少一些必需文件');
  console.log('❌ 请检查并修复问题');
}

console.log('\n🚀 下一步:');
console.log('1. 运行 npm run build 构建插件');
console.log('2. 按照上述指南安装到 Obsidian');
console.log('3. 测试插件功能');
console.log('4. 提交代码到 GitHub');

process.exit(allFilesExist ? 0 : 1);