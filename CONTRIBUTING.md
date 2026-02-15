# 贡献指南

感谢你考虑为 OpenClaw Memory Sync 插件贡献代码！本指南将帮助你开始贡献。

## 🎯 开始之前

### 行为准则
请阅读并遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

### 开发环境
- Node.js 18+ 
- npm 或 yarn
- Git
- Obsidian (用于测试)

### 获取代码
```bash
# 克隆仓库
git clone https://github.com/YearsAlso/openclaw-memory-sync.git
cd openclaw-memory-sync

# 安装依赖
npm install
```

## 🔧 开发流程

### 1. 创建分支
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 开发模式
```bash
# 启动开发模式（监听文件变化）
npm run dev
```

### 3. 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="test name"

# 查看测试覆盖率
npm test -- --coverage
```

### 4. 代码检查
```bash
# 代码格式检查
npm run lint

# 自动修复格式问题
npm run lint -- --fix

# 代码格式化
npm run format
```

### 5. 构建插件
```bash
# 生产构建
npm run build

# 清理构建文件
npm run clean
```

## 📝 代码规范

### TypeScript 规范
- 使用 TypeScript 4.7+
- 启用严格模式
- 为所有公共 API 添加类型定义
- 避免使用 `any` 类型

### 代码风格
- 使用 2 空格缩进
- 使用单引号
- 末尾分号
- 最大行宽 100 字符

### 提交信息规范
使用 Conventional Commits 规范：
```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

类型包括：
- `feat`: 新功能
- `fix`: bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

示例：
```
feat(sync): 添加WebSocket实时同步功能

- 实现WebSocket客户端
- 添加连接状态管理
- 添加自动重连机制

Closes #123
```

## 🧪 测试指南

### 单元测试
- 测试文件放在 `src/__tests__/` 目录
- 使用 Jest 测试框架
- 测试覆盖率目标：80%+

### 集成测试
- 模拟 Obsidian API
- 测试插件生命周期
- 测试设置面板

### 手动测试
在 Obsidian 中测试：
1. 构建插件：`npm run build`
2. 复制文件到 Obsidian 插件目录
3. 重启 Obsidian
4. 启用插件并测试功能

## 📦 发布流程

### 版本管理
使用语义化版本：
- `MAJOR`: 不兼容的 API 修改
- `MINOR`: 向下兼容的功能新增
- `PATCH`: 向下兼容的问题修复

### 发布步骤
1. 更新版本号：
   ```bash
   # 更新 manifest.json 和 package.json
   npm run version
   ```

2. 提交更改：
   ```bash
   git add manifest.json package.json
   git commit -m "chore: release v1.0.0"
   ```

3. 创建标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. GitHub Actions 会自动：
   - 运行测试
   - 构建插件
   - 创建 GitHub Release
   - 生成发布包

## 🐛 报告问题

### Bug 报告
请使用 [Bug Report 模板](.github/ISSUE_TEMPLATE/bug_report.md) 并提供：
1. 详细的复现步骤
2. 预期行为 vs 实际行为
3. 环境信息
4. 相关日志

### 功能请求
请使用 [Feature Request 模板](.github/ISSUE_TEMPLATE/feature_request.md) 并提供：
1. 功能描述
2. 使用场景
3. 预期收益
4. 技术建议（可选）

## 🔍 代码审查

### 提交 PR 前
- [ ] 代码通过所有测试
- [ ] 代码通过 lint 检查
- [ ] 更新了相关文档
- [ ] 添加了必要的测试
- [ ] 提交信息符合规范

### 审查要点
- 代码正确性
- 测试覆盖率
- 性能影响
- 安全性考虑
- 向后兼容性

## 📚 文档

### 代码文档
- 为所有公共 API 添加 JSDoc 注释
- 为复杂逻辑添加注释
- 更新 README 中的使用说明

### 用户文档
- 更新安装指南
- 添加配置说明
- 提供故障排除指南

## 🏗️ 项目结构

```
openclaw-memory-sync/
├── src/                    # 源代码
│   ├── __tests__/         # 测试文件
│   ├── utils/             # 工具函数
│   ├── views/             # 界面组件
│   └── types/             # 类型定义
├── .github/               # GitHub 配置
│   ├── workflows/         # GitHub Actions
│   └── ISSUE_TEMPLATE/    # Issue 模板
├── main.ts                # 插件入口
├── manifest.json          # 插件清单
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 🤝 获取帮助

- 查看 [开发文档](DEVELOPMENT.md)
- 阅读 [设计文档](obsidian-plugin-design.md)
- 在 Issues 中提问
- 查看现有代码示例

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

感谢你的贡献！🎉