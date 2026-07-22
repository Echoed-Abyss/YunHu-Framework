# 云湖机器人插件框架 (YunHu Bot Framework)

一个基于 **TCP + Protobuf + RSA/AES** 加密通信的云湖机器人插件化开发平台。

## ✨ 特性

- **TCP长连接通信**: 高性能TCP服务器，支持高并发插件连接
- **Protobuf序列化**: 跨语言、高性能的数据序列化方案
- **RSA+AES加密**: 非对称加密密钥协商 + 对称加密通信，安全高效
- **插件API网关**: 统一封装云湖平台API，插件通过TCP即可调用
- **事件实时推送**: 云湖事件自动转换为Protobuf并推送给订阅插件
- **可视化管理台**: React + Ant Design 明亮白色系 + 轻二次元风格 + ECharts 数据看板
- **插件日志输出**: 提供 `WriteLog` API，插件可直接向前端输出日志

## 🏗️ 架构

```
云湖平台 (HTTP/Webhook)
        │
        ▼
┌───────────────────────────────────┐
│       框架后端 (NestJS)            │
│  ┌─────────┬──────────┬─────────┐ │
│  │ 云湖客户端 │ 事件分发 │ API网关 │ │
│  └────┬─────┴────┬─────┴────┬────┘ │
│       └──────────┼──────────┘       │
│                  ▼                   │
│          TCP服务器 (RSA+AES)         │
└──────────────────┬──────────────────┘
                   │
         TCP + Protobuf + AES
                   │
          ┌────────┴────────┐
          ▼                 ▼
      插件1             插件2 ...
```

## 📦 项目结构

```
yunhu-bot-framework/
├── backend/        # NestJS 后端
├── frontend/       # React + Ant Design 前端
├── proto/          # Protobuf 协议定义
├── docs/           # 文档
├── start.sh        # Linux 一键启动脚本
├── launcher.js     # Node.js 通用启动器
├── launcher.c      # Windows EXE 启动器源码
└── yunhu-bot.exe   # Windows 一键启动程序
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### Linux 一键启动

```bash
./start.sh
```

该脚本会自动并发安装前后端依赖，并并发启动服务。

### Windows 一键启动

直接运行打包好的可执行文件：

```bash
yunhu-bot.exe
```

### 手动启动

#### 后端启动

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

#### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 访问
- 管理后台: http://localhost:5173
- 后端API: http://localhost:3000
- TCP端口: 8888

## 📚 文档

- [开发部署指南](docs/README.md)
- [云湖API文档](docs/yunhu-api.md)
- [项目结构](docs/structure.md)
- [Python插件示例](docs/plugin-example-python.md)

## 🔌 插件接入

### TCP 握手流程

1. **获取服务端RSA公钥**: `GET /api/plugins/rsa/public-key`
2. **生成AES密钥(32字节)并用RSA公钥加密**
3. **连接TCP端口** (默认 `127.0.0.1:8888`，生产环境可配置为 `0.0.0.0`)
4. **发送握手请求** (HandshakeRequest)：携带加密的AES密钥、Plugin ID、Bot Token
5. **服务端验证** 并返回握手成功响应 (HandshakeResponse)
6. **后续通信** 全部使用 AES-256-CBC 加密

### TCP 协议格式

**握手前(明文)**: 客户端直接发送 Protobuf 编码的 `Message` 消息（无长度前缀）
**握手后(加密)**: 客户端发送 AES-256-CBC 加密后的 `Message` 消息

**通用消息结构** (Protobuf):
```protobuf
message Message {
  MessageType type = 1;     // 消息类型枚举
  bytes payload = 2;        // 负载(根据type不同解码为不同的子消息)
  int64 timestamp = 3;      // 毫秒时间戳
  string request_id = 4;    // 请求ID(用于请求/响应匹配)
}

enum MessageType {
  UNKNOWN = 0;
  HANDSHAKE_REQUEST = 1;
  HANDSHAKE_RESPONSE = 2;
  PLUGIN_REQUEST = 3;
  PLUGIN_RESPONSE = 4;
  EVENT_PUSH = 5;
  HEARTBEAT = 6;
  HEARTBEAT_ACK = 7;
  ERROR = 8;
}
```

### RSA 加密填充说明

服务端**优先使用 RSA-OAEP-SHA256**（标准），同时**兼容 RSA-PKCS#1 v1.5** 填充（部分老客户端如易语言默认使用）。

### 插件API列表

插件通过TCP连接调用以下API (完整定义见 `proto/api.proto`):

| API名称 | 描述 | 请求消息 | 响应消息 |
|---------|------|----------|----------|
| `SendMessage` | 发送消息(支持文本/图片/视频/文件/Markdown/HTML/按钮) | `SendMessageRequest` | `SendMessageResponse` |
| `EditMessage` | 编辑已发送的消息 | `EditMessageRequest` | `EditMessageResponse` |
| `RecallMessage` | 撤回消息 | `RecallMessageRequest` | `RecallMessageResponse` |
| `BatchSendMessage` | 批量发送消息 | `BatchSendMessageRequest` | `BatchSendMessageResponse` |
| `SetBoard` | 设置用户/全局看板 | `SetBoardRequest` | `SetBoardResponse` |
| `UnsetBoard` | 取消看板 | `UnsetBoardRequest` | `UnsetBoardResponse` |
| `GetMessageList` | 获取消息列表 | `GetMessageListRequest` | `GetMessageListResponse` |
| `GetUserInfo` | 获取用户信息 | `GetUserInfoRequest` | `GetUserInfoResponse` |
| `GetGroupInfo` | 获取群组信息 | `GetGroupInfoRequest` | `GetGroupInfoResponse` |
| `UploadFile` | 上传文件 | `UploadFileRequest` | `UploadFileResponse` |
| `WriteLog` | 插件日志输出 (推送到前端日志流) | `WriteLogRequest` | `WriteLogResponse` |

### 事件订阅

握手时通过 `subscribed_events` 字段订阅事件，事件通过 `EventPush` 消息推送：

| 事件类型 | 描述 | 消息 |
|----------|------|------|
| `message.receive` | 收到普通消息 | `MessageReceiveEvent` |
| `bot.followed` | 用户关注机器人 | `BotFollowedEvent` |
| `bot.unfollowed` | 用户取消关注 | `BotUnfollowedEvent` |
| `group.join` | 用户加入群 | `GroupJoinEvent` |
| `group.leave` | 用户退出群 | `GroupLeaveEvent` |
| `button.report` | 按钮点击上报 | `ButtonReportEvent` |
| `bot.shortcut_menu` | 快捷菜单触发 | `BotShortcutMenuEvent` |

### WriteLog API 详细说明

`WriteLog` 是专门提供给插件的日志API，允许插件将运行日志实时输出到前端管理台的日志流中。

**请求参数**：
- `level`: 日志级别 (`DEBUG` / `INFO` / `WARN` / `ERROR`)
- `message`: 日志内容
- `source`: 日志来源标识 (可选，默认使用 pluginId)

**使用示例** (Python):
```python
request = WriteLogRequest()
request.level = LogLevel.INFO
request.message = "插件启动成功"
request.source = "my_plugin"
```

**前端展示**: 日志会实时推送到前端管理台 `http://localhost:5173` 的日志页面。

## 🛡️ 安全机制

- **默认安全绑定**: TCP 服务默认绑定 `127.0.0.1`（仅本机访问），生产环境可手动改为 `0.0.0.0`
- **RSA-2048 + OAEP-SHA256**: 密钥交换与身份认证（同时兼容 PKCS#1 v1.5）
- **AES-256-CBC**: 对称加密通信内容
- **Bot Token**: 机器人身份验证
- **Plugin ID**: 插件唯一标识
- **握手白名单**: 只有通过握手的连接才能使用 API

## 🔧 故障排查

### 前端启动后白屏/找不到模块

npm 工作空间下所有依赖提升到根 `node_modules`，子项目通过符号链接访问：
```bash
# 如果前端 node_modules 丢失，重新创建符号链接
cd frontend && ln -sf ../node_modules node_modules
```

### 后端启动报 `@nestjs/cli` 找不到

```bash
cd backend && npm install @nestjs/cli --save-dev --no-package-lock
```

### 插件连接后无响应

1. 确认发送的握手消息是纯 Protobuf 编码（无 4 字节长度前缀）
2. 确认 RSA 加密输出 256 字节（2048 位密钥）
3. 检查服务端日志 `[TcpServerService] Plugin authenticated` 是否出现

### Windows 下 `rollup` 模块缺失

本项目已使用 `--no-package-lock` 避免跨平台 lockfile 冲突，缺失模块时重新安装：
```bash
npm install @rollup/rollup-win32-x64-msvc --no-package-lock --save-dev
```

## 📝 License

MIT
