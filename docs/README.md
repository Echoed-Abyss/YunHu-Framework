# 云湖机器人插件框架 - 开发部署指南

## 目录

1. [项目概述](#项目概述)
2. [架构设计](#架构设计)
3. [快速开始](#快速开始)
4. [后端开发指南](#后端开发指南)
5. [前端开发指南](#前端开发指南)
6. [插件接入指南](#插件接入指南)
7. [部署指南](#部署指南)
8. [API参考](#api参考)
9. [常见问题](#常见问题)

---

## 项目概述

云湖机器人插件框架是一个基于 TCP + Protobuf + RSA/AES 加密通信的机器人插件化开发平台。框架作为云湖平台与第三方插件之间的通信中枢，提供安全、高效的双向通信能力。

### 核心特性

- **TCP长连接通信**: 基于TCP协议的长连接，支持高并发、低延迟的消息传输
- **Protobuf序列化**: 使用Protocol Buffers进行数据序列化，高性能、跨语言兼容
- **RSA+AES加密**: 采用非对称加密进行身份认证和密钥协商，对称加密保证通信效率
- **插件API网关**: 封装云湖平台API，为插件提供统一的调用接口
- **事件分发引擎**: 将云湖平台事件实时推送给订阅的插件
- **可视化管理后台**: React + Ant Design 暗色主题，ECharts数据看板

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        云湖平台                              │
│  (WebSocket/HTTP API - 消息发送、事件订阅)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP/Webhook
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    框架后端 (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  云湖客户端  │  │  事件分发引擎 │  │  插件API网关     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │            │
│         └──────────┬───────┴────────────────────┘            │
│                    │                                        │
│              ┌─────▼──────┐                                 │
│              │  TCP服务器  │  (RSA+AES加密 + Protobuf)      │
│              └─────┬──────┘                                 │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ TCP + Protobuf + AES
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    第三方插件群                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 插件1    │ │ 插件2    │ │ 插件3    │ │ 插件N    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

**下行（云湖 → 插件）**:
1. 云湖平台通过Webhook推送事件到框架
2. 事件分发引擎解析并转换为Protobuf格式
3. TCP服务器通过加密连接推送给订阅插件

**上行（插件 → 云湖）**:
1. 插件通过TCP发送Protobuf格式的API请求
2. 插件API网关解析并调用云湖API
3. 返回结果通过TCP返回给插件

### 目录结构

```
yunhu-bot-framework/
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── main.ts            # 入口文件
│   │   ├── app.module.ts      # 根模块
│   │   ├── app.controller.ts  # 根控制器
│   │   ├── common/            # 公共模块
│   │   │   ├── proto/         # Protobuf 服务
│   │   │   └── utils/         # 工具函数（加密等）
│   │   └── modules/           # 业务模块
│   │       ├── tcp-server/    # TCP服务器模块
│   │       ├── yunhu/         # 云湖平台模块
│   │       ├── events/        # 事件分发模块
│   │       ├── plugin-gateway/# 插件API网关
│   │       └── dashboard/     # 数据看板模块
│   ├── proto/                 # Protobuf 定义（可选）
│   ├── .env.example           # 环境变量示例
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── main.tsx           # 入口
│   │   ├── App.tsx            # 根组件
│   │   ├── components/        # 组件
│   │   │   ├── Layout/        # 布局组件
│   │   │   ├── Dashboard/     # 仪表盘
│   │   │   ├── LogStream/     # 日志流
│   │   │   └── PluginManagement/  # 插件管理
│   │   ├── pages/             # 页面
│   │   ├── api/               # API 接口
│   │   ├── types/             # 类型定义
│   │   └── styles/            # 样式
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── proto/                      # Protobuf 协议定义
│   ├── common.proto           # 通用消息类型
│   ├── api.proto              # API请求/响应
│   └── events.proto           # 事件类型
├── docs/                       # 文档
│   ├── yunhu-api.md           # 云湖API文档
│   └── README.md              # 本文档
└── package.json                # 根 package.json
```

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Protocol Buffers 编译器 (可选，用于编译.proto文件)

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd yunhu-bot-framework

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
HTTP_PORT=3000
TCP_HOST=0.0.0.0
TCP_PORT=8888
YUNHU_BASE_URL=https://chat-go.jwzhd.com/open-apis/v1
NODE_ENV=development
```

### 启动开发服务器

```bash
# 启动后端 (终端1)
cd backend
npm run start:dev

# 启动前端 (终端2)
cd frontend
npm run dev
```

访问:
- 前端管理后台: http://localhost:5173
- 后端API: http://localhost:3000
- TCP插件端口: 8888

### 一键启动方式

除上述分别启动前后端的方式外，框架还提供以下便捷启动方式，均会并发安装前后端依赖并并发启动服务：

- **Linux一键启动**：运行 `./start.sh`，脚本会并发安装前后端依赖并并发启动服务
- **Windows EXE启动**：双击运行 `yunhu-bot.exe`（或运行 `npm run build:exe` 重新打包），程序会并发安装前后端依赖并并发启动服务
- **Node.js启动**：运行 `npm run dev`，通过 launcher.js 并发启动前后端

---

## 后端开发指南

### 核心模块说明

#### 1. TCP服务器模块 (tcp-server)

负责处理插件的TCP连接、安全握手、消息编解码。

**关键文件**:
- `tcp-server.service.ts` - TCP服务器核心服务
- `plugin-connection.interface.ts` - 插件连接接口定义

**核心功能**:
- TCP连接管理
- RSA+AES握手与密钥交换
- Protobuf消息编解码
- 心跳检测
- 连接状态管理

#### 2. 云湖模块 (yunhu)

负责与云湖平台的API交互和Webhook接收。

**关键文件**:
- `yunhu-api.service.ts` - 云湖API客户端
- `yunhu-webhook.controller.ts` - Webhook接收控制器

#### 3. 事件分发模块 (events)

负责将云湖事件转换并分发给插件。

**关键文件**:
- `event-dispatcher.service.ts` - 事件分发服务

#### 4. 插件API网关模块 (plugin-gateway)

负责将插件的TCP请求转换为云湖API调用。

**关键文件**:
- `plugin-gateway.service.ts` - API网关服务

#### 5. 数据看板模块 (dashboard)

提供前端展示所需的统计数据和日志。

**关键文件**:
- `dashboard.service.ts` - 看板数据服务
- `dashboard.controller.ts` - 看板API控制器

### 添加新的API接口

1. 在 `proto/api.proto` 中定义请求和响应消息
2. 在 `plugin-gateway.service.ts` 中添加处理方法
3. 在 `handlePluginRequest` 的switch中添加新的case

### 添加新的事件类型

1. 在 `proto/events.proto` 中定义事件消息
2. 在 `event-dispatcher.service.ts` 的 `convertEventToProto` 中添加转换逻辑
3. 在TCP推送时自动分发给订阅插件

---

## 前端开发指南

### 技术栈

- React 18 + TypeScript
- Ant Design 5 (暗色主题)
- ECharts 5 (数据可视化)
- Vite (构建工具)
- React Router 6 (路由)
- Axios (HTTP请求)

### 页面结构

1. **数据看板** (`/dashboard`) - 机器人状态、消息吞吐量、事件分布
2. **插件管理** (`/plugins`) - 插件连接列表、状态监控、RSA公钥
3. **日志流** (`/logs`) - 实时日志查看、筛选、导出
4. **API网关** (`/gateway`) - API调用统计、成功率、API列表
5. **机器人管理** (`/bots`) - 机器人配置、Token管理
6. **系统设置** (`/settings`) - TCP服务、云湖配置、系统参数

### 开发新页面

```tsx
// 1. 在 src/pages 下创建页面组件
import { Card } from 'antd';

const MyPage: React.FC = () => {
  return <Card title="我的页面">内容</Card>;
};

export default MyPage;

// 2. 在 App.tsx 中添加路由
<Route path="/my-page" element={<MyPage />} />

// 3. 在 MainLayout.tsx 中添加菜单项
{
  key: '/my-page',
  icon: <MyIcon />,
  label: '我的页面',
}
```

### 前端 UI 更新说明

前端已升级为明亮白色系 + 轻二次元风格 UI，主要视觉特性如下：

- 主色 `#4A90D9`，大圆角 `16px`，柔和阴影
- 仪表盘采用马卡龙色系渐变统计卡片和 ECharts 图表
- 日志页使用斑马纹和气泡式消息流
- 插件管理采用卡片式列表布局

---

## 插件接入指南

### 通信流程

1. **建立TCP连接**: 插件客户端连接到框架的TCP端口
2. **RSA密钥获取**: 通过HTTP API获取服务端RSA公钥
3. **生成AES密钥**: 插件生成随机AES密钥和IV
4. **发起握手请求**: 用RSA公钥加密AES密钥，发送握手请求
5. **握手响应**: 服务端验证并返回握手响应
6. **加密通信**: 后续通信使用AES加密

### 消息格式

所有TCP消息采用长度前缀 + 加密Protobuf消息的格式：

```
┌─────────────────┬─────────────────────────────┐
│  长度 (4字节)    │  加密的Protobuf消息 (N字节)  │
│  Big-Endian     │  AES-256-CBC 加密            │
└─────────────────┴─────────────────────────────┘
```

### Protobuf消息结构

所有消息都包装在 `Message` 中：

```protobuf
message Message {
  MessageType type = 1;      // 消息类型
  bytes payload = 2;         // 消息体（特定类型的Protobuf）
  int64 timestamp = 3;       // 时间戳
  string request_id = 4;     // 请求ID（用于请求-响应匹配）
}
```

### 安全握手流程

**1. 获取RSA公钥**

```
GET /api/plugins/rsa/public-key

Response:
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
}
```

**2. 生成AES密钥**

```python
# Python 示例
import os
from Crypto.Cipher import AES
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256

# 生成AES密钥和IV
aes_key = os.urandom(32)  # 256位
aes_iv = os.urandom(16)   # 128位

# 用RSA公钥加密AES密钥
rsa_key = RSA.import_key(public_key)
cipher_rsa = PKCS1_OAEP.new(rsa_key, SHA256)
encrypted_aes_key = cipher_rsa.encrypt(aes_key)
```

**3. 发送握手请求**

构建 `HandshakeRequest` 消息：

```protobuf
message HandshakeRequest {
  string plugin_id = 1;                    // 插件唯一标识
  string plugin_name = 2;                  // 插件名称
  string plugin_version = 3;               // 插件版本
  string bot_token = 4;                    // 云湖Bot Token
  bytes rsa_encrypted_aes_key = 5;         // RSA加密的AES密钥
  string aes_iv = 6;                       // AES IV (base64编码)
  repeated string subscribed_events = 7;   // 订阅的事件列表（空为全部）
}
```

注意：握手请求**不加密**，直接明文发送。

**4. 接收握手响应**

```protobuf
message HandshakeResponse {
  bool success = 1;        // 是否成功
  string message = 2;      // 消息
  string server_version = 3; // 服务端版本
  int64 server_time = 4;   // 服务端时间
  string session_id = 5;   // 会话ID
}
```

握手成功后，后续所有消息都需要用AES加密。

### 调用API

**发送API请求**:

```protobuf
message PluginRequest {
  string api_name = 1;                    // API名称
  map<string, string> metadata = 2;       // 元数据
  bytes parameters = 3;                   // 参数（Protobuf编码）
}
```

**API响应**:

```protobuf
message PluginResponse {
  bool success = 1;       // 是否成功
  int32 code = 2;         // 错误码
  string message = 3;     // 消息
  bytes data = 4;         // 返回数据（Protobuf编码）
  string request_id = 5;  // 请求ID
}
```

### 可用API列表

| API名称 | 说明 |
|---------|------|
| SendMessage | 发送消息 |
| EditMessage | 编辑消息 |
| RecallMessage | 撤回消息 |
| BatchSendMessage | 批量发送消息 |
| SetBoard | 设置看板 |
| UnsetBoard | 取消看板 |
| GetMessageList | 获取消息列表 |
| GetUserInfo | 获取用户信息 |
| GetGroupInfo | 获取群组信息 |
| UploadFile | 上传文件 |
| WriteLog | 写入插件日志 |

### 插件日志 API (WriteLog)

新增 `WriteLog` API，允许插件向框架发送日志，日志会显示在前端管理台的日志流中。

**Protobuf 定义** (api.proto):

```protobuf
enum LogLevel {
  LOG_LEVEL_UNSPECIFIED = 0;
  DEBUG = 1;
  INFO = 2;
  WARN = 3;
  ERROR = 4;
}

message WriteLogRequest {
  LogLevel level = 1;
  string message = 2;
  string source = 3;
}

message WriteLogResponse {
  bool success = 1;
}
```

**调用方式**：插件通过 PluginRequest 发送，api_name 设为 "WriteLog"，parameters 为编码后的 WriteLogRequest。

**前端展示**：日志会出现在前端管理台的"日志流"页面，同时可通过 `GET /api/dashboard/plugin-logs` API 获取插件日志列表。

### 发送消息示例

**请求参数 (SendMessageRequest)**:

```protobuf
message SendMessageRequest {
  string recv_id = 1;
  RecvType recv_type = 2;
  ContentType content_type = 3;
  TextContent text_content = 4;
  string parent_id = 10;
}
```

**Python示例代码**:

```python
import socket
import struct
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import proto.common_pb2 as common_pb
import proto.api_pb2 as api_pb

class YunhuPluginClient:
    def __init__(self, host, port, plugin_id, bot_token):
        self.host = host
        self.port = port
        self.plugin_id = plugin_id
        self.bot_token = bot_token
        self.aes_key = None
        self.aes_iv = None
        self.socket = None
        self.request_seq = 0

    def connect(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((self.host, self.port))

    def _send_message(self, msg_type, payload, request_id=""):
        # 构建Message
        msg = common_pb.Message()
        msg.type = msg_type
        msg.payload = payload
        msg.timestamp = int(time.time() * 1000)
        msg.request_id = request_id
        data = msg.SerializeToString()

        # 加密（握手后）
        if self.aes_key and msg_type != common_pb.HANDSHAKE_REQUEST:
            cipher = AES.new(self.aes_key, AES.MODE_CBC, self.aes_iv)
            data = cipher.encrypt(pad(data, AES.block_size))

        # 发送长度前缀 + 数据
        length = struct.pack('>I', len(data))
        self.socket.sendall(length + data)

    def _recv_message(self):
        # 读取长度
        length_data = self._recv_exact(4)
        length = struct.unpack('>I', length_data)[0]

        # 读取数据
        data = self._recv_exact(length)

        # 解密
        if self.aes_key:
            cipher = AES.new(self.aes_key, AES.MODE_CBC, self.aes_iv)
            data = unpad(cipher.decrypt(data), AES.block_size)

        # 解析Message
        msg = common_pb.Message()
        msg.ParseFromString(data)
        return msg

    def _recv_exact(self, n):
        data = b''
        while len(data) < n:
            chunk = self.socket.recv(n - len(data))
            if not chunk:
                raise ConnectionError("Connection closed")
            data += chunk
        return data

    def handshake(self, rsa_public_key_pem):
        # 生成AES密钥
        self.aes_key = os.urandom(32)
        self.aes_iv = os.urandom(16)

        # RSA加密AES密钥
        from Crypto.PublicKey import RSA
        from Crypto.Cipher import PKCS1_OAEP
        from Crypto.Hash import SHA256
        rsa_key = RSA.import_key(rsa_public_key_pem)
        cipher_rsa = PKCS1_OAEP.new(rsa_key, SHA256)
        encrypted_key = cipher_rsa.encrypt(self.aes_key)

        # 构建握手请求
        req = common_pb.HandshakeRequest()
        req.plugin_id = self.plugin_id
        req.plugin_name = "My Plugin"
        req.plugin_version = "1.0.0"
        req.bot_token = self.bot_token
        req.rsa_encrypted_aes_key = encrypted_key
        req.aes_iv = base64.b64encode(self.aes_iv).decode()

        # 发送握手请求（明文）
        self._send_message(common_pb.HANDSHAKE_REQUEST, req.SerializeToString())

        # 接收响应（明文）
        resp_msg = self._recv_message()
        assert resp_msg.type == common_pb.HANDSHAKE_RESPONSE

        resp = common_pb.HandshakeResponse()
        resp.ParseFromString(resp_msg.payload)

        if not resp.success:
            raise Exception(f"Handshake failed: {resp.message}")

        print(f"Handshake successful! Session: {resp.session_id}")
        return True

    def send_message(self, recv_id, recv_type, text):
        self.request_seq += 1
        request_id = f"req_{self.request_seq}"

        # 构建SendMessageRequest
        req = api_pb.SendMessageRequest()
        req.recv_id = recv_id
        req.recv_type = recv_type
        req.content_type = api_pb.TEXT
        req.text_content.text = text

        # 包装为PluginRequest
        plugin_req = common_pb.PluginRequest()
        plugin_req.api_name = "SendMessage"
        plugin_req.parameters = req.SerializeToString()

        # 发送
        self._send_message(
            common_pb.PLUGIN_REQUEST,
            plugin_req.SerializeToString(),
            request_id
        )

        # 接收响应
        resp_msg = self._recv_message()
        assert resp_msg.type == common_pb.PLUGIN_RESPONSE

        resp = common_pb.PluginResponse()
        resp.ParseFromString(resp_msg.payload)

        if not resp.success:
            raise Exception(f"API error: {resp.message}")

        # 解析响应数据
        result = api_pb.SendMessageResponse()
        result.ParseFromString(resp.data)
        return result
```

### 接收事件推送

服务端会将订阅的云湖事件主动推送给插件：

```protobuf
message EventPush {
  string event_type = 1;     // 事件类型
  string event_id = 2;       // 事件ID
  int64 event_time = 3;      // 事件时间
  string bot_id = 4;         // 机器人ID
  bytes payload = 5;         // 事件数据（Protobuf编码）
}
```

**事件类型**:
- `message.receive.normal` - 普通消息
- `message.receive.instruction` - 指令消息
- `bot.followed` - 关注机器人
- `bot.unfollowed` - 取消关注
- `group.join` - 加入群
- `group.leave` - 退出群
- `button.report.inline` - 按钮点击

### 心跳机制

插件应定期发送心跳以保持连接：

```protobuf
message Heartbeat {
  int64 timestamp = 1;
  int32 seq = 2;
}
```

服务端会响应：

```protobuf
message HeartbeatAck {
  int64 timestamp = 1;
  int32 seq = 2;
  int64 server_time = 3;
}
```

建议心跳间隔：30秒。超过60秒未收到心跳，服务端会断开连接。

---

## 部署指南

### Docker 部署

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
      - "8888:8888"
    environment:
      - NODE_ENV=production
      - HTTP_PORT=3000
      - TCP_HOST=0.0.0.0
      - TCP_PORT=8888
    restart: unless-stopped
    volumes:
      - ./data:/app/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 后端 Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY ../proto ../proto

EXPOSE 3000 8888
CMD ["node", "dist/main.js"]
```

### 前端 Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Webhook
    location /webhook {
        proxy_pass http://backend:3000/webhook;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SSE 流式响应
    location /api/dashboard/stream {
        proxy_pass http://backend:3000/api/dashboard/stream;
        proxy_set_header Host $host;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### 生产环境配置

1. **启用TLS**: 为TCP连接启用TLS加密（使用tls模块）
2. **配置防火墙**: 只开放必要端口（80, 443, 8888）
3. **设置日志**: 配置日志轮转和持久化
4. **监控告警**: 接入Prometheus + Grafana监控
5. **备份策略**: 定期备份配置数据

---

## API参考

### 后端HTTP API

#### 看板接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard/stats | 获取看板统计数据 |
| GET | /api/dashboard/logs | 获取最近日志 |
| GET | /api/dashboard/stream | SSE流式统计数据 |
| GET | /api/dashboard/logs/stream | SSE流式日志 |

#### 插件接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/plugins | 获取插件列表 |
| GET | /api/plugins/:sessionId | 获取插件详情 |
| GET | /api/plugins/count | 获取插件数量 |
| GET | /api/plugins/rsa/public-key | 获取RSA公钥 |

#### API网关接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/gateway/stats | 获取API调用统计 |
| GET | /api/gateway/apis | 获取可用API列表 |

#### 云湖接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/yunhu/send | 发送消息 |
| POST | /api/yunhu/edit | 编辑消息 |
| POST | /api/yunhu/recall | 撤回消息 |
| GET | /api/yunhu/messages | 获取消息列表 |
| POST | /api/yunhu/board | 设置看板 |
| POST | /api/yunhu/board/cancel | 取消看板 |
| GET | /api/yunhu/user/:userId | 获取用户信息 |
| GET | /api/yunhu/group/:groupId | 获取群组信息 |

#### Webhook接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /webhook | 接收云湖事件推送 |
| POST | /webhook/:botId | 指定机器人的事件推送 |

---

## 常见问题

### Q: TCP连接无法建立？

A: 请检查：
1. TCP端口是否开放（默认8888）
2. 防火墙是否允许连接
3. 服务端是否正常运行

### Q: 握手失败怎么办？

A: 常见原因：
1. RSA公钥不正确 - 重新获取公钥
2. AES密钥加密方式不对 - 确认使用OAEP padding + SHA256
3. IV编码错误 - 确认使用base64编码

### Q: 事件推送收不到？

A: 请检查：
1. 插件是否正确订阅了事件类型
2. 云湖控制台是否配置了正确的Webhook地址
3. 事件是否触发（如用户是否发送了消息）

### Q: 如何调试Protobuf消息？

A: 可以：
1. 启用调试日志
2. 使用Protobuf官方工具解码
3. 检查消息长度前缀是否正确

### Q: 支持哪些编程语言开发插件？

A: 支持任何支持TCP + Protobuf + RSA/AES的语言，包括但不限于：
- Python
- Node.js
- Go
- Java
- C#
- Rust
- Dart
- PHP
- Ruby

### Q: 如何确保通信安全？

A: 框架采用多层安全机制：
1. RSA-2048 + OAEP 密钥交换
2. AES-256-CBC 对称加密
3. Bot Token 身份认证
4. Plugin ID 插件标识
5. 可选的TLS传输层加密

---

## 技术支持

如有问题，请查阅以下资源：
- 云湖官方文档: https://www.yhchat.com/document/1-3
- Protobuf官方文档: https://protobuf.dev/
- NestJS官方文档: https://docs.nestjs.com/
