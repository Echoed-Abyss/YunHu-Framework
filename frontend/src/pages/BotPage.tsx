import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';

interface Bot {
  id: string;
  name: string;
  token: string;
  status: 'active' | 'inactive';
  webhookUrl: string;
  eventSubscriptions: string[];
  createdAt: string;
}

const BotManagement: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([
    {
      id: 'bot_001',
      name: '测试机器人',
      token: 'token_xxxxxxxxx',
      status: 'active',
      webhookUrl: 'http://localhost:3000/webhook?token=xxx',
      eventSubscriptions: ['message.receive.normal', 'bot.followed'],
      createdAt: '2024-01-01',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingBot(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot);
    form.setFieldsValue(bot);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setBots(bots.filter((b) => b.id !== id));
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBot) {
        setBots(bots.map((b) => (b.id === editingBot.id ? { ...b, ...values } : b)));
        message.success('更新成功');
      } else {
        const newBot: Bot = {
          ...values,
          id: `bot_${Date.now()}`,
          status: 'active',
          eventSubscriptions: [],
          createdAt: new Date().toISOString().split('T')[0],
        };
        setBots([...bots, newBot]);
        message.success('添加成功');
      }
      setModalVisible(false);
    } catch (err) {
      // validation error
    }
  };

  const toggleStatus = (id: string, checked: boolean) => {
    setBots(
      bots.map((b) =>
        b.id === id ? { ...b, status: checked ? 'active' : 'inactive' } : b,
      ),
    );
  };

  const columns = [
    {
      title: '机器人',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Bot) => (
        <Space>
          <RobotOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
          <Tag color={record.status === 'active' ? 'green' : 'default'}>
            {record.status === 'active' ? '运行中' : '已停用'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Bot Token',
      dataIndex: 'token',
      key: 'token',
      render: (token: string) => (
        <code style={{ color: '#722ed1', fontSize: 12 }}>
          {token.substring(0, 8)}...
        </code>
      ),
    },
    {
      title: '订阅事件',
      dataIndex: 'eventSubscriptions',
      key: 'eventSubscriptions',
      render: (events: string[]) => (
        <Space size={[4, 4]} wrap>
          {events.slice(0, 2).map((ev) => (
            <Tag key={ev} color="blue" style={{ fontSize: 11 }}>
              {ev}
            </Tag>
          ))}
          {events.length > 2 && <Tag style={{ fontSize: 11 }}>+{events.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (_: any, record: Bot) => (
        <Switch
          checked={record.status === 'active'}
          onChange={(checked) => toggleStatus(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Bot) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="机器人管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加机器人
        </Button>
      }
    >
      <Table columns={columns} dataSource={bots} rowKey="id" size="small" />

      <Modal
        title={editingBot ? '编辑机器人' : '添加机器人'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="机器人名称"
            rules={[{ required: true, message: '请输入机器人名称' }]}
          >
            <Input placeholder="请输入机器人名称" />
          </Form.Item>
          <Form.Item
            name="token"
            label="Bot Token"
            rules={[{ required: true, message: '请输入Bot Token' }]}
          >
            <Input.Password placeholder="请输入从云湖控制台获取的Token" />
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook地址">
            <Input placeholder="自动生成，可自定义" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BotManagement;
