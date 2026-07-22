# 项目结构说明

```
yunhu-bot-framework/
├── LICENSE
├── README.md
├── package.json                    # 根package.json (workspace)
├── start.sh                        # Linux 一键启动脚本（并发安装+启动）
├── launcher.js                     # Windows/通用 Node.js 启动器（可打包为 exe）
├── yunhu-bot.exe                   # Windows 可执行文件（pkg 打包）
│
├── proto/                          # Protobuf 协议定义
│   ├── common.proto                # 通用消息类型、握手、心跳等
│   ├── api.proto                   # API请求/响应消息定义
│   └── events.proto                # 事件推送消息定义
│
├── backend/                        # NestJS 后端服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   └── src/
│       ├── main.ts                 # 应用入口
│       ├── app.module.ts           # 根模块
│       ├── app.controller.ts       # 根控制器 (health check)
│       │
│       ├── common/                 # 公共模块
│       │   ├── proto/
│       │   │   └── proto.service.ts    # Protobuf编解码服务
│       │   └── utils/
│       │       └── crypto.util.ts      # 加密工具 (RSA+AES)
│       │
│       └── modules/                # 业务模块
│           ├── tcp-server/         # TCP服务器模块
│           │   ├── tcp-server.module.ts
│           │   ├── tcp-server.service.ts     # TCP服务器核心
│           │   ├── tcp-server.controller.ts  # TCP监控API
│           │   └── plugin-connection.interface.ts
│           │
│           ├── yunhu/              # 云湖平台模块
│           │   ├── yunhu.module.ts
│           │   ├── yunhu-api.service.ts      # 云湖API客户端
│           │   ├── yunhu-webhook.controller.ts # Webhook接收
│           │   └── yunhu.controller.ts       # 云湖API代理
│           │
│           ├── events/             # 事件分发模块
│           │   ├── events.module.ts
│           │   └── event-dispatcher.service.ts
│           │
│           ├── plugin-gateway/     # 插件API网关
│           │   ├── plugin-gateway.module.ts
│           │   ├── plugin-gateway.service.ts
│           │   └── plugin-gateway.controller.ts
│           │
│           └── dashboard/          # 数据看板模块
│               ├── dashboard.module.ts
│               ├── dashboard.service.ts
│               └── dashboard.controller.ts
│
├── frontend/                       # React 前端管理台
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx                # 入口
│       ├── App.tsx                 # 根组件 + 路由
│       ├── styles/
│       │   └── global.css          # 全局样式
│       ├── types/
│       │   └── index.ts            # TypeScript类型定义
│       ├── api/
│       │   └── index.ts            # API接口封装
│       ├── components/
│       │   ├── Layout/
│       │   │   └── MainLayout.tsx  # 主布局（侧边栏+头部+内容）
│       │   ├── Dashboard/
│       │   │   └── Dashboard.tsx   # 数据仪表盘 (ECharts)
│       │   ├── LogStream/
│       │   │   └── LogStream.tsx   # 实时日志流
│       │   └── PluginManagement/
│       │       └── PluginManagement.tsx  # 插件管理
│       └── pages/
│           ├── GatewayPage.tsx     # API网关页面
│           ├── BotPage.tsx         # 机器人管理
│           └── SettingsPage.tsx    # 系统设置
│
└── docs/                           # 项目文档
    ├── README.md                   # 开发部署指南
    └── yunhu-api.md                # 云湖API文档
```

## 模块说明

### 后端模块

| 模块 | 职责 |
|------|------|
| TcpServerModule | 管理TCP长连接、RSA+AES安全握手、Protobuf编解码、心跳检测 |
| YunhuModule | 封装云湖平台HTTP API，接收Webhook事件推送 |
| EventsModule | 事件分发引擎，将云湖事件转换为Protobuf并推送插件 |
| PluginGatewayModule | 插件API网关，将插件TCP请求转换为云湖API调用 |
| DashboardModule | 数据统计与日志，为前端提供看板数据 |

### 前端页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 数据看板 | /dashboard | 插件状态、事件趋势、API调用统计、最近日志 |
| 插件管理 | /plugins | 连接列表、详情查看、RSA公钥管理 |
| 日志流 | /logs | 实时日志、筛选搜索、导出 |
| API网关 | /gateway | API调用统计、成功率、API列表 |
| 机器人管理 | /bots | 机器人配置、Token管理 |
| 系统设置 | /settings | TCP、云湖、系统参数配置 |
