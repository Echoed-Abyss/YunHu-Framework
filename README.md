# 云湖机器人插件框架 (YunHu Bot Framework)

一个基于 **TCP + Protobuf + RSA/AES** 加密通信的云湖机器人插件化开发平台。

## ✨ 特性

- **TCP长连接通信**: 高性能TCP服务器，支持高并发插件连接
- **Protobuf序列化**: 跨语言、高性能的数据序列化方案
- **RSA+AES加密**: 非对称加密密钥协商 + 对称加密通信，安全高效
- **插件API网关**: 统一封装云湖平台API，插件通过TCP即可调用
- **事件实时推送**: 云湖事件自动转换为Protobuf并推送给订阅插件
- **可视化管理台**: React + Ant Design 暗色主题 + ECharts 数据看板

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
└── docs/           # 文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 后端启动

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

### 前端启动

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

1. 获取服务端RSA公钥: `GET /api/plugins/rsa/public-key`
2. 生成AES密钥并用RSA公钥加密
3. 连接TCP端口，发送握手请求
4. 握手成功后，使用AES加密通信

## 🛡️ 安全机制

- **RSA-2048 + OAEP**: 密钥交换与身份认证
- **AES-256-CBC**: 对称加密通信内容
- **Bot Token**: 机器人身份验证
- **Plugin ID**: 插件唯一标识

## 📝 License

MIT
