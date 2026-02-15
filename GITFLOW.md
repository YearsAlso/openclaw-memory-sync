# GitFlow 工作流指南

## 📊 分支结构

### 主要分支
- **main** - 生产就绪代码，只接受来自 release 或 hotfix 的合并
- **develop** - 开发集成分支，功能开发完成后的合并目标

### 支持分支
- **feature/** - 新功能开发分支，从 develop 分支创建
- **release/** - 发布准备分支，从 develop 分支创建
- **hotfix/** - 紧急修复分支，从 main 分支创建

## 🚀 工作流程

### 1. 功能开发 (Feature Development)
```bash
# 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 开发功能并提交
git add .
git commit -m "feat: add your feature"

# 完成功能后合并到 develop
git checkout develop
git pull origin develop
git merge --no-ff feature/your-feature-name
git push origin develop

# 删除功能分支
git branch -d feature/your-feature-name
```

### 2. 发布准备 (Release Preparation)
```bash
# 从 develop 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 进行发布准备（版本号更新、文档等）
npm run version  # 更新版本号
npm run build    # 构建插件

# 合并到 main 和 develop
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 删除发布分支
git branch -d release/v1.0.0
```

### 3. 紧急修复 (Hotfix)
```bash
# 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix

# 进行修复
git add .
git commit -m "fix: urgent fix for issue"

# 合并到 main 和 develop
git checkout main
git merge --no-ff hotfix/urgent-fix
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin main --tags

git checkout develop
git merge --no-ff hotfix/urgent-fix
git push origin develop

# 删除热修复分支
git branch -d hotfix/urgent-fix
```

## 🔒 分支保护规则

### main 分支
- ✅ 要求 Pull Request 审查
- ✅ 要求通过所有 CI 检查
- ✅ 禁止直接推送
- ✅ 要求线性提交历史
- ✅ 要求解决对话

### develop 分支
- ✅ 要求通过所有 CI 检查
- ✅ 禁止直接推送（推荐使用 PR）
- ⚠️ 可选：要求代码审查

### 功能分支
- 🔓 允许直接推送
- 🔓 不需要 CI 检查（但推荐）
- 🔓 定期清理过期分支

## 📋 Pull Request 流程

### 创建 PR
1. 从功能分支创建到 develop 的 PR
2. 填写 PR 模板
3. 等待 CI 检查通过
4. 请求代码审查

### PR 审查
- 至少需要 1 个审查者批准
- 所有对话必须解决
- 必须通过所有 CI 检查

### 合并策略
- **Squash and Merge** - 用于功能分支
- **Merge Commit** - 用于发布和热修复
- **Rebase and Merge** - 可选，保持线性历史

## 🏷️ 版本标签

### 标签格式
- `v1.0.0` - 正式发布
- `v1.0.0-rc.1` - 发布候选
- `v1.0.0-beta.1` - Beta 测试
- `v1.0.0-alpha.1` - Alpha 测试

### 创建标签
```bash
# 创建带注释的标签
git tag -a v1.0.0 -m "Release v1.0.0"

# 推送标签到远程
git push origin --tags
```

## 🔄 同步策略

### 日常开发
```bash
# 更新本地 develop 分支
git checkout develop
git pull origin develop

# 更新功能分支
git checkout feature/your-feature
git rebase develop
```

### 处理冲突
```bash
# 在合并前解决冲突
git checkout develop
git pull origin develop
git checkout feature/your-feature
git rebase develop

# 解决冲突后继续
git add .
git rebase --continue
```

## 🧹 分支清理

### 自动清理
GitHub Actions 会自动清理合并后的分支：
- 功能分支合并后自动删除
- 发布分支发布后自动删除
- 热修复分支修复后自动删除

### 手动清理
```bash
# 删除本地已合并的分支
git branch --merged | grep -v "\*" | grep -v "main" | grep -v "develop" | xargs -n 1 git branch -d

# 删除远程已合并的分支
git fetch --prune
```

## 📊 GitHub Actions 集成

### CI/CD 流程
1. **推送触发** - 所有分支推送触发 CI
2. **PR 触发** - PR 创建和更新触发 CI
3. **标签触发** - 标签创建触发发布流程

### 工作流对应关系
- `feature/*` → 运行测试和构建
- `develop` → 运行完整 CI 流程
- `release/*` → 运行发布验证
- `main` → 运行生产构建和发布

## 🚨 紧急情况处理

### 回滚发布
```bash
# 回滚到上一个标签
git checkout main
git revert <commit-hash>
git push origin main

# 或重置到上一个标签
git reset --hard v1.0.0
git push origin main --force  # 谨慎使用！
```

### 修复错误合并
```bash
# 创建修复分支
git checkout -b fix/wrong-merge

# 进行修复
git revert <bad-commit>

# 通过 PR 合并修复
```

## 📚 最佳实践

### 提交规范
- 使用 Conventional Commits 格式
- 提交信息清晰明了
- 每个提交解决一个问题

### 分支命名
- `feature/login-system` - 功能开发
- `release/v1.1.0` - 发布准备
- `hotfix/critical-bug` - 紧急修复
- `docs/update-readme` - 文档更新

### 代码审查
- 小批量提交，便于审查
- 提供清晰的变更说明
- 及时响应审查意见

## 🔧 工具支持

### Git 配置
```bash
# 设置 Git 别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

### IDE 集成
- VS Code GitLens 扩展
- GitHub Desktop 客户端
- GitKraken 图形界面

## 📞 支持与帮助

### 常见问题
1. **合并冲突** - 使用 rebase 而非 merge
2. **分支过期** - 定期 rebase 到 develop
3. **权限问题** - 联系仓库管理员

### 获取帮助
- 查看 GitHub Actions 日志
- 阅读 CONTRIBUTING.md
- 在 Issues 中提问

---

*遵循 GitFlow 工作流可以确保代码质量，简化发布流程，提高团队协作效率。*