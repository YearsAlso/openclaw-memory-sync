# OpenClaw Memory Sync - 开发指南

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- Obsidian >= 0.15.0
- Git

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
这将启动文件监视器，自动重新构建代码。

### 生产构建
```bash
npm run build
```

### 运行测试
```bash
npm test
```

### 代码检查
```bash
npm run lint
```

### 代码格式化
```bash
npm run format
```

## 📁 项目结构

```
openclaw-memory-sync/
├── src/
│   ├── main.ts              # 插件主入口
│   ├── api-client.ts        # OpenClaw API客户端
│   ├── sync-engine.ts       # 同步引擎核心
│   ├── views/               # 用户界面组件
│   │   ├── memory-view.ts   # 记忆库查看界面
│   │   └── sync-status.ts   # 同步状态界面
│   └── utils/               # 工具函数
│       ├── logger.ts        # 日志系统
│       └── helpers.ts       # 辅助函数
├── styles.css               # 样式文件
├── manifest.json            # 插件清单
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
├── esbuild.config.mjs       # 构建配置
└── README.md                # 项目文档
```

## 🔧 开发流程

### 1. 设置开发环境
1. 克隆项目
2. 安装依赖
3. 启动开发服务器

### 2. 创建新功能
1. 在 `src/` 目录下创建新文件
2. 导出必要的类型和函数
3. 在主文件中导入和使用

### 3. 测试功能
1. 编写单元测试
2. 运行测试确保功能正常
3. 手动测试插件功能

### 4. 代码审查
1. 运行代码检查
2. 格式化代码
3. 确保代码质量

### 5. 构建发布
1. 更新版本号
2. 构建生产版本
3. 提交和推送代码

## 🧪 测试指南

### 单元测试
- 测试文件放在 `src/__tests__/` 目录
- 使用 Jest 测试框架
- 测试覆盖率目标: 80%

### 集成测试
- 测试插件与Obsidian的集成
- 测试API连接和同步功能
- 测试用户界面交互

### 手动测试
1. 构建插件
2. 复制到Obsidian插件目录
3. 重启Obsidian
4. 测试所有功能

## 📝 代码规范

### TypeScript
- 使用严格类型检查
- 避免使用 `any` 类型
- 使用接口定义数据结构

### 命名约定
- 类名: PascalCase
- 函数名: camelCase
- 变量名: camelCase
- 常量名: UPPER_SNAKE_CASE
- 接口名: PascalCase (以 `I` 开头)

### 注释规范
- 公共API需要文档注释
- 复杂逻辑需要行内注释
- 使用英文注释

### 错误处理
- 使用try-catch处理异步错误
- 提供用户友好的错误消息
- 记录错误到日志系统

## 🔌 API集成

### OpenClaw API
- 基础URL: `http://localhost:8765`
- WebSocket: `ws://localhost:8766`
- 认证: 无认证（本地使用）

### API端点
- `GET /health` - 健康检查
- `GET /api/memory/files` - 获取文件列表
- `GET /api/memory/files/:filename` - 获取文件内容
- `POST /api/memory/files/:filename` - 创建/更新文件
- `DELETE /api/memory/files/:filename` - 删除文件
- `GET /api/memory/search` - 搜索记忆
- `GET /api/memory/stats` - 获取统计信息

## 🎨 用户界面

### 视图组件
- `MemoryView`: 记忆库查看界面
- `SyncStatusView`: 同步状态界面

### 设置面板
- API服务器配置
- 同步选项配置
- 高级设置

### 状态栏
- 同步状态指示器
- 快速操作按钮

## 🔄 同步引擎

### 同步流程
1. 获取远程文件列表
2. 获取本地文件列表
3. 计算文件差异
4. 应用差异（添加/修改/删除）
5. 处理冲突

### 冲突解决策略
- 时间戳优先
- 本地优先
- 远程优先
- 询问用户

### 增量同步
- 只同步变化的文件
- 使用文件哈希检测变化
- 支持断点续传

## 📊 日志系统

### 日志级别
- DEBUG: 调试信息
- INFO: 一般信息
- WARN: 警告信息
- ERROR: 错误信息

### 日志输出
- 控制台输出
- 文件日志（可选）
- 内存日志（用于界面显示）

## 🚀 发布流程

### 版本管理
1. 更新 `package.json` 版本号
2. 运行 `npm run version`
3. 提交版本变更

### 构建发布
1. 运行 `npm run build`
2. 创建发布包
3. 上传到GitHub Releases

### Obsidian社区
1. 提交到Obsidian社区插件市场
2. 更新文档
3. 发布公告

## 🐛 故障排除

### 常见问题

#### 插件无法加载
- 检查Obsidian版本
- 检查插件依赖
- 查看控制台错误

#### API连接失败
- 检查API服务器是否运行
- 检查网络连接
- 查看API服务器日志

#### 同步失败
- 检查文件权限
- 检查磁盘空间
- 查看同步日志

#### 界面显示异常
- 检查CSS样式
- 检查浏览器控制台
- 清除缓存

### 调试技巧
1. 启用调试日志
2. 使用浏览器开发者工具
3. 检查网络请求
4. 查看插件日志

## 🤝 贡献指南

### 报告问题
1. 搜索现有问题
2. 创建新Issue
3. 提供详细描述

### 提交代码
1. Fork项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

### 代码审查
1. 确保代码质量
2. 通过所有测试
3. 更新文档
4. 遵循代码规范

## 📚 学习资源

### Obsidian插件开发
- [Obsidian API文档](https://github.com/obsidianmd/obsidian-api)
- [Obsidian插件示例](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian开发者社区](https://forum.obsidian.md/c/developers-apis/14)

### TypeScript
- [TypeScript官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### 工具链
- [esbuild文档](https://esbuild.github.io/)
- [Jest文档](https://jestjs.io/docs/getting-started)
- [ESLint文档](https://eslint.org/docs/user-guide/getting-started)

## 📞 支持

- 📖 [文档](https://github.com/YearsAlso/openclaw-memory-sync/wiki)
- 🐛 [问题追踪](https://github.com/YearsAlso/openclaw-memory-sync/issues)
- 💬 [讨论区](https://github.com/YearsAlso/openclaw-memory-sync/discussions)
- 📧 邮箱: support@openclaw.ai

---

**Happy Coding!** 🚀