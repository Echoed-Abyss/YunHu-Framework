# 云湖机器人插件框架 - 示例插件（Python）

这是一个Python版本的示例插件，展示如何接入云湖机器人插件框架。

## 安装依赖

```bash
pip install protobuf cryptography websockets
# 或
pip install -r requirements.txt
```

## 使用方法

```python
from yunhu_plugin import YunhuPluginClient, EventType

# 创建客户端
client = YunhuPluginClient(
    host="localhost",
    port=8888,
    plugin_id="my-plugin-001",
    plugin_name="我的插件",
    plugin_version="1.0.0",
    bot_token="your-bot-token-from-yunhu-console",
)

# 获取RSA公钥（通过HTTP API）
import requests
resp = requests.get("http://localhost:3000/api/plugins/rsa/public-key")
public_key = resp.json()["publicKey"]

# 连接并握手
client.connect()
client.handshake(public_key)

# 发送消息
result = client.send_message(
    recv_id="user_123456",
    recv_type="user",
    text="你好，这是来自插件的消息！"
)
print(f"消息已发送: {result.msgId}")

# 监听事件
for event in client.listen_events():
    if event.event_type == EventType.MESSAGE_RECEIVE:
        print(f"收到消息: {event.content}")
        # 回复消息
        client.send_message(
            recv_id=event.sender_id,
            recv_type=event.chat_type,
            text=f"你说: {event.content}"
        )
```

## 完整示例

```python
import time
import threading
from yunhu_plugin import YunhuPluginClient, EventType

class EchoBotPlugin:
    def __init__(self):
        self.client = YunhuPluginClient(
            host="localhost",
            port=8888,
            plugin_id="echo-bot-001",
            plugin_name="Echo Bot",
            plugin_version="1.0.0",
            bot_token="your-bot-token",
            subscribed_events=[EventType.MESSAGE_RECEIVE],
        )
        self.running = False

    def start(self):
        # 获取公钥
        import requests
        resp = requests.get("http://localhost:3000/api/plugins/rsa/public-key")
        public_key = resp.json()["publicKey"]

        # 连接
        self.client.connect()
        self.client.handshake(public_key)
        self.running = True

        # 启动心跳线程
        threading.Thread(target=self._heartbeat_loop, daemon=True).start()

        # 监听事件
        self._event_loop()

    def _heartbeat_loop(self):
        while self.running:
            try:
                self.client.send_heartbeat()
                time.sleep(30)
            except Exception as e:
                print(f"Heartbeat error: {e}")
                break

    def _event_loop(self):
        for event in self.client.listen_events():
            self._handle_event(event)

    def _handle_event(self, event):
        if event.event_type == EventType.MESSAGE_RECEIVE:
            if event.content_type == "text":
                # Echo the message back
                text = f"Echo: {event.text_content}"
                self.client.send_message(
                    recv_id=event.sender_id,
                    recv_type="user" if event.chat_type == "bot" else "group",
                    text=text,
                )

if __name__ == "__main__":
    bot = EchoBotPlugin()
    bot.start()
```

## 支持的API

- `send_message(recv_id, recv_type, text)` - 发送文本消息
- `send_image(recv_id, recv_type, image_key)` - 发送图片
- `send_markdown(recv_id, recv_type, markdown)` - 发送Markdown
- `edit_message(msg_id, recv_id, recv_type, text)` - 编辑消息
- `recall_message(msg_id, recv_id, recv_type)` - 撤回消息
- `set_board(content, content_type, global_board)` - 设置看板
- `get_user_info(user_id)` - 获取用户信息
- `get_group_info(group_id)` - 获取群组信息

## 支持的事件

- `MESSAGE_RECEIVE` - 收到消息
- `BOT_FOLLOWED` - 关注机器人
- `BOT_UNFOLLOWED` - 取消关注
- `GROUP_JOIN` - 加入群
- `GROUP_LEAVE` - 退出群
- `BUTTON_REPORT` - 按钮点击
