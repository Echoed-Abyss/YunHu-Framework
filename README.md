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
2. **生成AES密钥并用RSA公钥加密**
3. **连接TCP端口** (默认 `127.0.0.1:8888`，生产环境可配置为 `0.0.0.0`)
4. **发送握手请求** (HandshakeRequest)：携带加密的AES密钥、Plugin ID、Bot Token
5. **服务端验证** 并返回握手成功响应
6. **后续通信** 全部使用 AES-256-CBC 加密

### 插件API列表

插件通过TCP连接调用以下API：

| API名称 | 描述 |
|---------|------|
| `SendMessage` | 发送消息 |
| `EditMessage` | 编辑消息 |
| `RecallMessage` | 撤回消息 |
| `BatchSendMessage` | 批量发送消息 |
| `SetBoard` | 设置看板 |
| `UnsetBoard` | 取消看板 |
| `GetMessageList` | 获取消息列表 |
| `GetUserInfo` | 获取用户信息 |
| `GetGroupInfo` | 获取群组信息 |
| `UploadFile` | 上传文件 |
| `WriteLog` | 插件日志输出 (向前端日志流推送) |

### WriteLog API

`WriteLog` 是专门提供给插件的日志API，允许插件将运行日志实时输出到前端管理台的日志流中。

**请求参数**：
- `level`: 日志级别 (`DEBUG` / `INFO` / `WARN` / `ERROR`)
- `message`: 日志内容
- `source`: 日志来源标识 (可选，默认使用 pluginId)

**使用示例** (Python): ```python request = WriteLogRequest() request.level = LogLevel.INFO request.message = "插件启动成功" request.source = "my_plugin" ```

## 🛡️ 安全机制

- **默认安全绑定**: TCP 服务默认绑定 `127.0.0.1`（仅本机访问），生产环境可手动改为 `0.0.0.0`
- **RSA-2048 + OAEP**: 密钥交换与身份认证
- **AES-256-CBC**: 对称加密通信内容
- **Bot Token**: 机器人身份验证
- **Plugin ID**: 插件唯一标识

## 📝 License

MIT
