import React from 'react';
import { Card, Form, Input, Select, Switch, Button, message, Divider, Tabs } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleSave = () => {
    message.success('设置已保存');
  };

  const tcpSettings = (
    <Form form={form} layout="vertical">
      <Form.Item label="TCP服务端口" name="tcpPort" initialValue={8888}>
        <Input type="number" />
      </Form.Item>
      <Form.Item label="绑定地址" name="tcpHost" initialValue="0.0.0.0">
        <Input />
      </Form.Item>
      <Form.Item label="启用TLS加密" name="tlsEnabled" initialValue={false} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="心跳超时(秒)" name="heartbeatTimeout" initialValue={60}>
        <Input type="number" />
      </Form.Item>
      <Divider />
      <Form.Item label="RSA密钥长度" name="rsaKeySize" initialValue={2048}>
        <Select>
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
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
        保存设置
      </Button>
    </Form>
  );

  const yunhuSettings = (
    <Form form={form} layout="vertical">
      <Form.Item label="云湖API地址" name="yunhuBaseUrl" initialValue="https://chat-go.jwzhd.com/open-apis/v1">
        <Input />
      </Form.Item>
      <Form.Item label="Webhook路径" name="webhookPath" initialValue="/webhook">
        <Input />
      </Form.Item>
      <Form.Item label="请求超时(毫秒)" name="requestTimeout" initialValue={30000}>
        <Input type="number" />
      </Form.Item>
      <Form.Item label="启用频率限制" name="rateLimitEnabled" initialValue={true} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Divider />
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
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
        <Input type="number" />
      </Form.Item>
      <Form.Item label="启用CORS" name="corsEnabled" initialValue={true} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item label="HTTP服务端口" name="httpPort" initialValue={3000}>
        <Input type="number" />
      </Form.Item>
      <Divider />
      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
        保存设置
      </Button>
    </Form>
  );

  return (
    <Card title="系统设置">
      <Tabs
        defaultActiveKey="tcp"
        items={[
          { key: 'tcp', label: 'TCP服务器', children: tcpSettings },
          { key: 'yunhu', label: '云湖配置', children: yunhuSettings },
          { key: 'system', label: '系统', children: systemSettings },
        ]}
      />
    </Card>
  );
};

export default SettingsPage;
