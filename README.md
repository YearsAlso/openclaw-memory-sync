# OpenClaw Memory Sync - Obsidian Plugin

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7C3AED)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

一个Obsidian插件，用于实时双向同步OpenClaw记忆库到Obsidian笔记应用。

## ✨ 特性

- 🔄 **双向同步**: OpenClaw ↔ Obsidian 实时双向同步
- ⚡ **实时更新**: WebSocket实时通知，延迟<1秒
- 🤖 **智能冲突解决**: 多策略冲突检测和解决
- 📊 **增量同步**: 只同步变化部分，高效快速
- 🎨 **美观界面**: 集成Obsidian UI，使用体验一致
- 🔧 **高度可配置**: 丰富的设置选项
- 📱 **移动端支持**: 支持Obsidian移动端应用

## 🚀 快速开始

### 前提条件

1. **OpenClaw API服务器**: 需要运行OpenClaw Memory API服务器
2. **Obsidian**: 安装Obsidian笔记应用
3. **Node.js**: 用于开发和构建

### 安装步骤

#### 1. 安装OpenClaw Memory API服务器

```bash
# 克隆API服务器仓库
git clone https://github.com/YearsAlso/openclaw-memory-api.git
cd openclaw-memory-api

# 安装依赖
npm install

# 启动服务器
npm start
```

#### 2. 安装Obsidian插件

**方法A: 从Obsidian社区插件市场安装** (推荐)
1. 打开Obsidian设置
2. 进入"社区插件"页面
3. 搜索"OpenClaw Memory Sync"
4. 点击安装并启用

**方法B: 手动安装**
1. 下载最新版本插件
2. 解压到Obsidian插件目录: `{vault}/.obsidian/plugins/openclaw-memory-sync`
3. 重启Obsidian
4. 在社区插件中启用本插件

#### 3. 配置插件

1. 打开Obsidian设置
2. 找到"OpenClaw Memory Sync"设置
3. 配置API服务器地址和端口
4. 设置同步选项
5. 点击"测试连接"验证配置

#### 4. 开始使用

- 点击侧边栏大脑图标打开同步面板
- 使用命令面板搜索"OpenClaw"相关命令
- 查看状态栏了解同步状态

## 📖 使用指南

### 基本功能

#### 1. 自动同步
- 插件会自动定期同步记忆文件
- 默认每5分钟同步一次
- 可在设置中调整同步间隔

#### 2. 手动同步
- 使用命令面板: `OpenClaw: 立即同步`
- 点击状态栏图标
- 在设置页面点击"立即同步"按钮

#### 3. 查看记忆库
- 使用命令面板: `OpenClaw: 查看记忆库`
- 浏览所有同步的记忆文件
- 支持搜索和过滤

#### 4. 监控同步状态
- 使用命令面板: `OpenClaw: 查看同步状态`
- 查看实时同步进度
- 查看错误日志和统计信息

### 高级功能

#### 1. 冲突解决策略
插件支持多种冲突解决策略:
- **时间戳优先**: 使用最新修改的文件
- **本地优先**: 总是使用本地版本
- **远程优先**: 总是使用远程版本
- **询问用户**: 弹出对话框让用户选择

#### 2. 文件排除
可以配置排除模式，不同步特定文件:
- `*.tmp`: 排除所有临时文件
- `.*`: 排除所有隐藏文件
- `node_modules/`: 排除特定目录

#### 3. WebSocket实时更新
启用后，文件变化会实时同步:
- 文件添加: 立即同步
- 文件修改: 立即同步
- 文件删除: 立即同步

#### 4. 日志系统
支持多级别日志:
- **调试**: 详细调试信息
- **信息**: 一般操作信息
- **警告**: 警告信息
- **错误**: 错误信息

## 🔧 开发指南

### 项目结构

```
openclaw-memory-sync/
├── src/
│   ├── main.ts              # 插件主文件
│   ├── api-client.ts        # API客户端
│   ├── sync-engine.ts       # 同步引擎
│   ├── views/
│   │   ├── memory-view.ts   # 记忆查看界面
│   │   └── sync-status.ts   # 同步状态界面
│   └── utils/
│       ├── logger.ts        # 日志工具
│       └── helpers.ts       # 辅助函数
├── manifest.json            # 插件清单
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript配置
├── esbuild.config.mjs       # 构建配置
└── README.md                # 项目文档
```

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/YearsAlso/openclaw-memory-sync.git
cd openclaw-memory-sync

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建插件
npm run build

# 运行测试
npm test
```

### 构建和发布

```bash
# 构建生产版本
npm run build

# 版本管理
npm run version

# 发布到GitHub
git tag v1.0.0
git push origin v1.0.0
```

## 📡 API接口

### REST API端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/memory/info` | 获取记忆库信息 |
| GET | `/api/memory/files` | 列出所有文件 |
| GET | `/api/memory/files/:filename` | 获取文件内容 |
| POST | `/api/memory/files/:filename` | 创建/更新文件 |
| DELETE | `/api/memory/files/:filename` | 删除文件 |
| GET | `/api/memory/search` | 搜索记忆 |
| GET | `/api/memory/stats` | 获取统计 |

### WebSocket接口

- **连接**: `ws://localhost:8766`
- **事件**: `file_changed`, `file_updated`, `file_deleted`
- **命令**: `ping`, `pong`, `subscribe`

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --testNamePattern="SyncEngine"
```

### 集成测试

```bash
# 启动测试服务器
npm run test:server

# 运行集成测试
npm run test:integration
```

### 性能测试

```bash
# 运行性能测试
npm run test:performance
```

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 报告问题

1. 在GitHub Issues中搜索是否已有类似问题
2. 创建新Issue，描述详细的问题
3. 提供复现步骤和环境信息

### 提交代码

1. Fork项目仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

### 代码规范

- 使用TypeScript编写代码
- 遵循Obsidian插件开发规范
- 添加适当的注释和文档
- 编写单元测试

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 优秀的笔记应用
- [OpenClaw](https://openclaw.ai/) - AI助手平台
- 所有贡献者和用户

## 📞 支持

- 📖 [文档](https://github.com/YearsAlso/openclaw-memory-sync/wiki)
- 🐛 [问题追踪](https://github.com/YearsAlso/openclaw-memory-sync/issues)
- 💬 [讨论区](https://github.com/YearsAlso/openclaw-memory-sync/discussions)
- 📧 邮箱: support@openclaw.ai

## 🌟 星星历史

[![Star History Chart](https://api.star-history.com/svg?repos=YearsAlso/openclaw-memory-sync&type=Date)](https://star-history.com/#YearsAlso/openclaw-memory-sync&Date)

---

**Happy Syncing!** 🚀

*由OpenClaw Assistant创建和维护*