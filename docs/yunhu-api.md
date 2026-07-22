# 云湖 API 文档

## 概述

云湖开放平台提供了丰富的API接口，用于机器人消息发送、群组管理、看板管理等功能。所有接口均通过HTTP/HTTPS协议进行数据交互。

**API基础地址**: `https://chat-go.jwzhd.com/open-apis/v1`

## 基础概念

### 机器人
机器人是一个虚拟用户，可以被多个用户添加为好友。不同用户和机器人的对话相互隔离。
- 订阅事件功能：任何人发送到机器人的消息都可以推送到订阅URL链接
- 通过机器人发送消息给用户

### 群
群即常见的群聊功能，每个群也拥有机器人的两个功能。

### 参数说明
- `userId`: 用户ID
- `recvId`: 接收消息的用户ID、群ID
- `recvType`: 接收类型，取值 user、group

## 接口调用方式

- **HTTP Method**: POST、GET
- **授权**: 部分接口带有token信息，通过URL参数传递
- **Content-Type**: `application/json; charset=utf-8`
- **频次限制**: 每个接口有不同的频次控制（通常10次/秒）

---

## 消息管理 API

### 1. 发送消息

向指定用户或群组发送消息。

**接口地址**: `POST /bot/send?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| recvId | string | 是 | 接收消息对象ID（用户: userId, 群: groupId） |
| recvType | string | 是 | 接收对象类型（user / group） |
| contentType | string | 是 | 消息类型：text / image / video / file / markdown / html |
| content | object | 是 | 消息内容对象 |
| parentId | string | 否 | 引用消息ID |

**Content对象 - text类型**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 消息正文 |
| buttons | array | 否 | 消息中包含的按钮列表 |

**Content对象 - image类型**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imageKey | string | 是 | 图片Key，通过图片上传接口获得 |
| buttons | array | 否 | 消息中包含的按钮列表 |

**Content对象 - markdown类型**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | markdown字符串 |
| buttons | array | 否 | 消息中包含的按钮列表 |

**Content对象 - file类型**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fileKey | string | 是 | 文件Key，通过文件上传接口获得 |
| buttons | array | 否 | 消息中包含的按钮列表 |

**Button对象**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 按钮上的文字 |
| actionType | int | 是 | 1:跳转URL, 2:复制, 3:点击汇报 |
| url | string | 否 | 当actionType为1时使用 |
| value | string | 否 | actionType为2时复制内容，为3时发送给订阅端 |

**响应内容**:

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 响应代码 |
| msg | string | 响应信息 |
| data | object | 返回数据 |

**请求示例**:
```json
{
  "recvId": "7058262",
  "recvType": "user",
  "contentType": "text",
  "content": {
    "text": "这里是消息内容",
    "buttons": [
      [
        {
          "text": "复制",
          "actionType": 2,
          "value": "xxxx"
        },
        {
          "text": "点击跳转",
          "actionType": 1,
          "url": "http://www.baidu.com"
        }
      ]
    ]
  }
}
```

---

### 2. 编辑消息

对已发出的消息进行修改。

**接口地址**: `POST /bot/edit?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| msgId | string | 是 | 消息ID |
| recvId | string | 是 | 接收消息对象ID（需与原消息保持一致） |
| recvType | string | 是 | 接收对象类型（需与原消息保持一致） |
| contentType | string | 是 | 消息类型：text / image / file / markdown |
| content | object | 是 | 消息对象，具体值见发送消息 |

---

### 3. 撤回消息

撤回群内消息或机器人消息。

**接口地址**: `POST /bot/recall?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| msgId | string | 是 | 消息ID |
| recvId | string | 是 | 接收消息对象ID |
| recvType | string | 是 | 接收对象类型 |

---

### 4. 批量发送消息

给机器人多位用户发送消息。

**接口地址**: `POST /bot/batch_send?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| recvIds | string[] | 是 | 用户ID列表 |
| contentType | string | 是 | 消息类型 |
| content | object | 是 | 消息内容 |

---

### 5. 流式发送消息

**接口地址**: `POST /bot/stream_send?token=YOUR_TOKEN`

---

### 6. 获取消息列表

获取最新消息列表，获取指定消息前后消息。

**接口地址**: `GET /bot/messages?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| chatId | string | 是 | 聊天对象ID |
| chatType | string | 是 | 聊天对象类型 |
| msgId | string | 否 | 基准消息ID |
| limit | int | 否 | 数量限制 |
| newer | bool | 否 | 是否获取更新的消息 |

---

### 7. 上传图片

**接口地址**: `POST /bot/upload/image?token=YOUR_TOKEN`

**Content-Type**: `multipart/form-data`

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 图片文件 |

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "fileKey": "xxx",
    "fileUrl": "https://..."
  }
}
```

---

### 8. 上传视频

**接口地址**: `POST /bot/upload/video?token=YOUR_TOKEN`

---

### 9. 上传文件

**接口地址**: `POST /bot/upload/file?token=YOUR_TOKEN`

---

## 看板管理 API

### 1. 设置全局看板

对机器人看板内容进行设置修改。

**接口地址**: `POST /bot/board-all?token=YOUR_TOKEN`

**速率限制**: 10次/秒

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| contentType | string | 是 | 消息类型：text / markdown / html |
| content | string | 是 | 内容文本 |
| expireTime | int | 否 | 过期时间的时间戳（秒级），0为不过期 |

---

### 2. 设置用户看板

**接口地址**: `POST /bot/board?token=YOUR_TOKEN`

**请求参数**: 增加 `userId` 字段

---

### 3. 取消全部看板

**接口地址**: `POST /bot/board-all-cancel?token=YOUR_TOKEN`

---

### 4. 取消用户看板

**接口地址**: `POST /bot/board-cancel?token=YOUR_TOKEN`

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |

---

## 群组管理 API

### 1. 群成员禁言

**接口地址**: `POST /bot/group/mute?token=YOUR_TOKEN`

### 2. 移除群成员

**接口地址**: `POST /bot/group/kick?token=YOUR_TOKEN`

### 3. 群内消息类型控制

**接口地址**: `POST /bot/group/message-control?token=YOUR_TOKEN`

### 4. 获取群标签列表

**接口地址**: `GET /bot/group/tags?token=YOUR_TOKEN`

### 5. 创建标签

**接口地址**: `POST /bot/group/tag/create?token=YOUR_TOKEN`

### 6. 修改标签

**接口地址**: `POST /bot/group/tag/update?token=YOUR_TOKEN`

### 7. 删除标签

**接口地址**: `POST /bot/group/tag/delete?token=YOUR_TOKEN`

### 8. 给用户添加标签

**接口地址**: `POST /bot/group/tag/add-user?token=YOUR_TOKEN`

### 9. 给用户移除标签

**接口地址**: `POST /bot/group/tag/remove-user?token=YOUR_TOKEN`

---

## 插件日志 API

框架为插件提供了 `WriteLog` API，允许插件向框架发送日志。日志会显示在前端管理台的日志流中，便于插件运行状态的观测与调试。

**调用方式**：插件通过 `PluginRequest` 发送，`api_name` 设为 `"WriteLog"`，`parameters` 为 Protobuf 编码后的 `WriteLogRequest`。

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
  LogLevel level = 1;      // 日志级别
  string message = 2;      // 日志内容
  string source = 3;       // 日志来源（如插件ID或名称）
}

message WriteLogResponse {
  bool success = 1;        // 是否写入成功
}
```

**WriteLogRequest 字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | LogLevel | 是 | 日志级别：DEBUG(1) / INFO(2) / WARN(3) / ERROR(4) |
| message | string | 是 | 日志正文内容 |
| source | string | 是 | 日志来源标识，建议填入插件ID或插件名称 |

**WriteLogResponse 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 是否写入成功 |

**前端展示**：

- 日志会出现在前端管理台的"日志流"页面
- 同时可通过 `GET /api/dashboard/plugin-logs` API 获取插件日志列表

---

## 事件订阅

事件订阅是系统将软件中的消息或其他事件推送到你的服务器中。推送通过HTTP协议以POST请求的方式推送JSON格式的数据。

### Webhook 配置

将你的Webhook URL填入云湖控制台中，系统会自动推送事件到该URL。

### 事件结构

```json
{
  "version": "1.0",
  "header": {
    "eventId": "事件ID，全局唯一",
    "eventTime": 1716000000000,
    "eventType": "message.receive.normal"
  },
  "event": {
    // 不同事件类型结构不同
  }
}
```

### Header 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| eventId | string | 事件ID，全局唯一 |
| eventTime | int | 事件产生时间（毫秒13位时间戳） |
| eventType | string | 事件类型 |

### 事件类型列表

| 事件名称 | 事件类型 | 说明 | 状态 |
|----------|----------|------|------|
| 普通消息事件 | message.receive.normal | 用户发送普通消息 | 可用 |
| 指令消息事件 | message.receive.instruction | 用户发送指令消息 | 可用 |
| 关注机器人事件 | bot.followed | 用户关注机器人 | 可用 |
| 取消关注机器人事件 | bot.unfollowed | 用户取消关注机器人 | 可用 |
| 加入群事件 | group.join | 用户加入群 | 可用 |
| 退出群事件 | group.leave | 用户退出群 | 可用 |
| 按钮事件 | button.report.inline | 消息中按钮点击事件 | 可用 |
| 快捷菜单事件 | bot.shortcut.menu | 聊天框上方菜单按钮事件 | 可用 |
| 机器人设置事件 | bot.setting | 机器人设置事件 | 可用 |
| A2UI机器人按钮事件 | a2ui.button.report | A2UI机器消息中按钮点击事件 | 可用 |

### 普通消息事件 (message.receive.normal)

**Event对象结构**:

| 字段 | 类型 | 说明 |
|------|------|------|
| sender | Sender对象 | 发送者信息 |
| chat | Chat对象 | 聊天对象信息 |
| message | Message对象 | 消息内容 |

**Sender对象**:

| 字段 | 类型 | 说明 |
|------|------|------|
| senderId | string | 发送者ID |
| senderType | string | 发送者用户类型（user） |
| senderUserLevel | string | 发送者级别（owner/administrator/member/unknown） |
| senderNickname | string | 发送者昵称 |
| senderAvatarUrl | string | 发送者头像URL |

**Chat对象**:

| 字段 | 类型 | 说明 |
|------|------|------|
| chatId | string | 聊天对象ID |
| chatType | string | 聊天对象类型（bot/group） |

**Message对象**:

| 字段 | 类型 | 说明 |
|------|------|------|
| msgId | string | 消息ID |
| parentId | string | 引用消息时的父消息ID |
| sendTime | int | 消息发送时间 |
| chatId | string | 当前聊天对象ID |
| chatType | string | 当前聊天对象类型 |
| contentType | string | 消息类型 |
| content | Content对象 | 消息正文 |
| instructionId | int | 指令ID（普通消息为0） |
| instructionName | string | 指令名称 |

**消息类型**:
- text: 文本消息
- image: 图片消息
- markdown: Markdown消息
- file: 文件消息
- video: 视频消息
- audio: 语音消息
- html: HTML消息

---

## 错误代码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未授权 |
| 1003 | 频率限制 |
| 1004 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 官方SDK

- Golang SDK
- Python SDK
- Java SDK
- PHP SDK

## 非官方SDK

- Python SDK
- Java SDK
- Dart SDK
- PHP SDK
- Node SDK
- Ruby SDK
