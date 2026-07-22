import React from 'react';
import { Card, Form, Input, Select, Switch, Button, message, Divider, Tabs } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleSave = () => {
    message.success('设置已保存');
  };

  const tabIcons: Record<string, string> = {
    tcp: '🛰️',
    yunhu: '☁️',
    system: '⚙️',
  };

  const tcpSettings = (
    <Form form={form} layout="vertical">
      <Form.Item label="TCP服务端口" name="tcpPort" initialValue={8888}>
        <Input type="number" style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item label="绑定地址" name="tcpHost" initialValue="127.0.0.1">
        <Input style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item
        label="启用TLS加密"
        name="tlsEnabled"
        initialValue={false}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item label="心跳超时(秒)" name="heartbeatTimeout" initialValue={60}>
        <Input type="number" style={{ borderRadius: 10 }} />
      </Form.Item>
      <Divider style={{ borderColor: '#f0f4fa' }} />
      <Form.Item label="RSA密钥长度" name="rsaKeySize" initialValue={2048}>
        <Select style={{ borderRadius: 10 }}>
          <Option value={1024}>1024位</Option>
          <Option value={2048}>2048位</Option>
          <Option value={4096}>4096位</Option>
        </Select>
      </Form.Item>
      <Form.Item label="AES加密模式" name="aesMode" initialValue="aes-256-cbc">
        <Select>
          <Option value="aes-128-cbc">AES-128-CBC</Option>
          <Option value="aes-192-cbc">AES-192-CBC</Option>
          <Option value="aes-256-cbc">AES-256-CBC</Option>
        </Select>
      </Form.Item>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        style={{ borderRadius: 12 }}
      >
        保存设置
      </Button>
    </Form>
  );

  const yunhuSettings = (
    <Form form={form} layout="vertical">
      <Form.Item
        label="云湖API地址"
        name="yunhuBaseUrl"
        initialValue="https://chat-go.jwzhd.com/open-apis/v1"
      >
        <Input style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item label="Webhook路径" name="webhookPath" initialValue="/webhook">
        <Input style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item label="请求超时(毫秒)" name="requestTimeout" initialValue={30000}>
        <Input type="number" style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item
        label="启用频率限制"
        name="rateLimitEnabled"
        initialValue={true}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Divider style={{ borderColor: '#f0f4fa' }} />
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        style={{ borderRadius: 12 }}
      >
        保存设置
      </Button>
    </Form>
  );

  const systemSettings = (
    <Form form={form} layout="vertical">
      <Form.Item label="日志级别" name="logLevel" initialValue="info">
        <Select>
          <Option value="debug">Debug</Option>
          <Option value="info">Info</Option>
          <Option value="warn">Warn</Option>
          <Option value="error">Error</Option>
        </Select>
      </Form.Item>
      <Form.Item label="日志保留天数" name="logRetentionDays" initialValue={30}>
        <Input type="number" style={{ borderRadius: 10 }} />
      </Form.Item>
      <Form.Item
        label="启用CORS"
        name="corsEnabled"
        initialValue={true}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item label="HTTP服务端口" name="httpPort" initialValue={3000}>
        <Input type="number" style={{ borderRadius: 10 }} />
      </Form.Item>
      <Divider style={{ borderColor: '#f0f4fa' }} />
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        style={{ borderRadius: 12 }}
      >
        保存设置
      </Button>
    </Form>
  );

  return (
    <Card
      title={
        <span style={{ color: '#333' }}>
          <span style={{ marginRight: 6 }}>⚙️</span>系统设置
        </span>
      }
      style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
      headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
    >
      <Tabs
        defaultActiveKey="tcp"
        items={[
          {
            key: 'tcp',
            label: (
              <span>
                <span style={{ marginRight: 4 }}>{tabIcons.tcp}</span>TCP服务器
              </span>
            ),
            children: tcpSettings,
          },
          {
            key: 'yunhu',
            label: (
              <span>
                <span style={{ marginRight: 4 }}>{tabIcons.yunhu}</span>云湖配置
              </span>
            ),
            children: yunhuSettings,
          },
          {
            key: 'system',
            label: (
              <span>
                <span style={{ marginRight: 4 }}>{tabIcons.system}</span>系统
              </span>
            ),
            children: systemSettings,
          },
        ]}
      />
    </Card>
  );
};

export default SettingsPage;
