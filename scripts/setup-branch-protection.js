#!/usr/bin/env node

/**
 * 设置 GitHub 分支保护规则的脚本
 * 需要 GitHub CLI (gh) 和适当的权限
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔒 设置 GitHub 分支保护规则\n');

const REPO = 'YearsAlso/openclaw-memory-sync';

// 分支保护配置
const BRANCH_PROTECTION_RULES = {
  'main': {
    requiredStatusChecks: {
      strict: true,
      contexts: [
        'Test and Lint',
        'Build and Package'
      ]
    },
    requiredPullRequestReviews: {
      requiredApprovingReviewCount: 1,
      dismissStaleReviews: true,
      requireCodeOwnerReviews: false
    },
    enforceAdmins: false,
    requiredLinearHistory: true,
    allowForcePushes: false,
    allowDeletions: false,
    restrictions: null
  },
  'develop': {
    requiredStatusChecks: {
      strict: true,
      contexts: [
        'Test and Lint',
        'Build and Package'
      ]
    },
    requiredPullRequestReviews: null, // 可选
    enforceAdmins: false,
    requiredLinearHistory: false,
    allowForcePushes: false,
    allowDeletions: false,
    restrictions: null
  }
};

// 检查 GitHub CLI 是否安装
try {
  execSync('gh --version', { stdio: 'pipe' });
  console.log('✅ GitHub CLI 已安装');
} catch (error) {
  console.log('❌ GitHub CLI 未安装');
  console.log('请先安装: https://cli.github.com/');
  process.exit(1);
}

// 检查是否已登录
try {
  const authStatus = execSync('gh auth status', { stdio: 'pipe' }).toString();
  if (!authStatus.includes('Logged in to github.com')) {
    console.log('❌ 未登录 GitHub CLI');
    console.log('请运行: gh auth login');
    process.exit(1);
  }
  console.log('✅ 已登录 GitHub CLI');
} catch (error) {
  console.log('❌ GitHub CLI 认证检查失败');
  process.exit(1);
}

// 设置分支保护规则
async function setupBranchProtection() {
  console.log('\n📋 设置分支保护规则:');
  
  for (const [branch, rules] of Object.entries(BRANCH_PROTECTION_RULES)) {
    console.log(`\n🔧 设置 ${branch} 分支保护规则:`);
    
    try {
      // 构建命令参数
      const args = [
        'api',
        '-X', 'PUT',
        `repos/${REPO}/branches/${branch}/protection`,
        '-H', 'Accept: application/vnd.github.v3+json',
        '-f', `required_status_checks=${JSON.stringify(rules.requiredStatusChecks)}`,
        '-f', 'enforce_admins=false',
        '-f', `required_linear_history=${rules.requiredLinearHistory}`,
        '-f', `allow_force_pushes=${rules.allowForcePushes}`,
        '-f', `allow_deletions=${rules.allowDeletions}`
      ];
      
      if (rules.requiredPullRequestReviews) {
        args.push('-f', `required_pull_request_reviews=${JSON.stringify(rules.requiredPullRequestReviews)}`);
      }
      
      // 执行命令
      execSync(`gh ${args.join(' ')}`, { stdio: 'pipe' });
      console.log(`✅ ${branch} 分支保护规则设置成功`);
      
    } catch (error) {
      console.log(`❌ 设置 ${branch} 分支保护规则失败:`, error.message);
    }
  }
}

// 设置默认分支
async function setDefaultBranch() {
  console.log('\n🎯 设置默认分支:');
  
  try {
    execSync(`gh api -X PATCH repos/${REPO} -f default_branch=main`, { stdio: 'pipe' });
    console.log('✅ 默认分支已设置为 main');
  } catch (error) {
    console.log('❌ 设置默认分支失败:', error.message);
  }
}

// 创建分支规则文档
function createBranchRulesDocument() {
  console.log('\n📄 创建分支规则文档:');
  
  const doc = `# 分支保护规则

## main 分支
- **保护状态**: 🔒 严格保护
- **合并要求**:
  - ✅ 至少 1 个代码审查批准
  - ✅ 所有 CI 检查必须通过
  - ✅ 必须解决所有对话
  - ✅ 线性提交历史
- **推送限制**:
  - ❌ 禁止强制推送
  - ❌ 禁止直接推送
  - ❌ 禁止删除分支

## develop 分支
- **保护状态**: 🛡️ 中等保护
- **合并要求**:
  - ✅ 所有 CI 检查必须通过
  - ⚠️ 代码审查（可选）
- **推送限制**:
  - ❌ 禁止强制推送
  - ❌ 禁止直接推送（推荐使用 PR）
  - ❌ 禁止删除分支

## 功能分支 (feature/*)
- **保护状态**: 🔓 宽松保护
- **合并要求**: 无
- **推送限制**: 允许直接推送

## 热修复分支 (hotfix/*)
- **保护状态**: 🚨 紧急保护
- **合并要求**: 同 main 分支
- **推送限制**: 允许授权用户直接推送

## 发布分支 (release/*)
- **保护状态**: 🚀 发布保护
- **合并要求**: 同 main 分支
- **推送限制**: 允许发布管理员直接推送

## CI 检查要求

### main 和 develop 分支必须通过:
1. **Test and Lint** - 单元测试和代码检查
2. **Build and Package** - 构建和打包检查

### 所有分支推荐通过:
1. **Code Quality** - 代码质量检查
2. **Validate Workflows** - 工作流验证

## 例外情况

### 紧急修复
如需绕过保护规则进行紧急修复：
1. 联系仓库管理员
2. 使用 hotfix/* 分支
3. 事后补充审查和文档

### 管理员操作
仓库管理员可以：
1. 临时禁用保护规则
2. 强制推送（谨慎使用）
3. 删除受保护分支

## 更新记录

- **2026-02-15**: 初始分支保护规则设置
- **计划**: 根据团队反馈调整规则

---

*分支保护规则旨在保证代码质量，防止意外更改，促进团队协作。*`;
  
  fs.writeFileSync('BRANCH_RULES.md', doc);
  console.log('✅ 分支规则文档已创建: BRANCH_RULES.md');
}

// 主函数
async function main() {
  console.log('🚀 开始设置 GitHub 仓库配置\n');
  
  try {
    // 检查仓库访问权限
    console.log('🔍 检查仓库访问权限...');
    execSync(`gh repo view ${REPO}`, { stdio: 'pipe' });
    console.log('✅ 可以访问仓库');
    
    // 设置默认分支
    await setDefaultBranch();
    
    // 设置分支保护规则
    await setupBranchProtection();
    
    // 创建文档
    createBranchRulesDocument();
    
    console.log('\n🎉 所有配置完成！');
    console.log('\n📋 下一步:');
    console.log('1. 在 GitHub 仓库设置中确认分支保护规则');
    console.log('2. 根据需要调整规则配置');
    console.log('3. 分享 BRANCH_RULES.md 给团队成员');
    
  } catch (error) {
    console.log('❌ 配置失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('- 没有仓库的管理员权限');
    console.log('- GitHub CLI 权限不足');
    console.log('- 网络连接问题');
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);