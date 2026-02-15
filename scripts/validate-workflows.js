#!/usr/bin/env node

/**
 * 验证 GitHub Actions 工作流配置
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const WORKFLOWS_DIR = '.github/workflows';

console.log('🔍 验证 GitHub Actions 工作流配置\n');

// 检查工作流文件是否存在
const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

console.log(`找到 ${workflowFiles.length} 个工作流文件:`);
workflowFiles.forEach(file => console.log(`  📄 ${file}`));

console.log('\n📋 详细检查:\n');

let hasErrors = false;

// 检查每个工作流文件
for (const file of workflowFiles) {
  const filePath = path.join(WORKFLOWS_DIR, file);
  console.log(`检查 ${file}:`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = yaml.load(content);
    
    // 检查必需字段
    if (!workflow.name) {
      console.log(`  ❌ 缺少 name 字段`);
      hasErrors = true;
    } else {
      console.log(`  ✅ name: ${workflow.name}`);
    }
    
    if (!workflow.on) {
      console.log(`  ❌ 缺少 on 触发器配置`);
      hasErrors = true;
    } else {
      console.log(`  ✅ 触发器配置正常`);
    }
    
    if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
      console.log(`  ❌ 缺少 jobs 配置`);
      hasErrors = true;
    } else {
      console.log(`  ✅ 包含 ${Object.keys(workflow.jobs).length} 个 job`);
    }
    
    // 检查 job 配置
    for (const [jobName, jobConfig] of Object.entries(workflow.jobs)) {
      if (!jobConfig['runs-on']) {
        console.log(`  ⚠️  job "${jobName}" 缺少 runs-on 配置`);
      }
      
      if (!jobConfig.steps || jobConfig.steps.length === 0) {
        console.log(`  ⚠️  job "${jobName}" 缺少 steps 配置`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ 解析 YAML 失败: ${error.message}`);
    hasErrors = true;
  }
  
  console.log('');
}

// 检查必需文件
console.log('📁 检查必需文件:');

const requiredFiles = [
  'manifest.json',
  'package.json',
  'main.ts',
  'README.md',
  'LICENSE'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} 不存在`);
    hasErrors = true;
  }
}

// 检查插件构建产物
console.log('\n🔧 检查插件构建:');

const buildFiles = ['main.js', 'styles.css', 'manifest.json'];
for (const file of buildFiles) {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ⚠️  ${file} 不存在，需要运行 npm run build`);
  }
}

// 总结
console.log('\n📊 验证总结:');
if (hasErrors) {
  console.log('❌ 发现配置问题，请修复后再提交');
  process.exit(1);
} else {
  console.log('✅ 所有配置检查通过！');
  console.log('\n🚀 下一步:');
  console.log('1. 提交代码到 GitHub');
  console.log('2. GitHub Actions 会自动运行');
  console.log('3. 创建 release tag 触发发布');
  console.log('4. 提交到 Obsidian 插件市场');
}

// 验证 manifest.json
console.log('\n📦 验证 manifest.json:');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const requiredFields = ['id', 'name', 'version', 'minAppVersion', 'description', 'author'];
  
  for (const field of requiredFields) {
    if (!manifest[field]) {
      console.log(`  ❌ 缺少必需字段: ${field}`);
      hasErrors = true;
    } else {
      console.log(`  ✅ ${field}: ${manifest[field]}`);
    }
  }
  
  // 验证版本号格式
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(manifest.version)) {
    console.log(`  ❌ 版本号格式错误: ${manifest.version}，应为 x.y.z 格式`);
    hasErrors = true;
  } else {
    console.log(`  ✅ 版本号格式正确: ${manifest.version}`);
  }
  
} catch (error) {
  console.log(`  ❌ 解析 manifest.json 失败: ${error.message}`);
  hasErrors = true;
}

console.log('\n🎉 验证完成！');