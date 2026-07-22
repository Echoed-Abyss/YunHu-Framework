import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Tag,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Empty,
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

  const avatarPalette = [
    { bg: 'linear-gradient(135deg, #A8D8FF 0%, #4A90D9 100%)', shadow: 'rgba(74, 144, 217, 0.25)' },
    { bg: 'linear-gradient(135deg, #FFB5C5 0%, #ff8aa3 100%)', shadow: 'rgba(255, 138, 163, 0.25)' },
    { bg: 'linear-gradient(135deg, #B5E8C5 0%, #5bc485 100%)', shadow: 'rgba(91, 196, 133, 0.25)' },
    { bg: 'linear-gradient(135deg, #D4B5E8 0%, #b388e8 100%)', shadow: 'rgba(179, 136, 232, 0.25)' },
    { bg: 'linear-gradient(135deg, #FFE8B5 0%, #f0b94a 100%)', shadow: 'rgba(240, 185, 74, 0.25)' },
  ];

  const getAvatarStyle = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
  };

  return (
    <Card
      title={
        <span style={{ color: '#333' }}>
          <span style={{ marginRight: 6 }}>🤖</span>机器人管理
        </span>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 12 }}
        >
          添加机器人
        </Button>
      }
      style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
      headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
    >
      {bots.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#999' }}>暂无机器人，点击右上角添加</span>}
          style={{ padding: 60 }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {bots.map((bot) => {
            const avatar = getAvatarStyle(bot.id);
            const isActive = bot.status === 'active';
            return (
              <Col xs={24} sm={12} lg={8} key={bot.id}>
                <div
                  className="yh-hover-card"
                  style={{
                    borderRadius: 16,
                    padding: 18,
                    background: '#fff',
                    border: '1px solid #f0f4fa',
                    boxShadow: '0 2px 12px rgba(74, 144, 217, 0.06)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    opacity: isActive ? 1 : 0.75,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        background: avatar.bg,
                        boxShadow: `0 4px 12px ${avatar.shadow}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      <RobotOutlined />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#333',
                          fontSize: 15,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bot.name}
                        </span>
                      </div>
                      <Tag
                        color={isActive ? 'green' : 'default'}
                        style={{ marginTop: 4, borderRadius: 10, fontSize: 11 }}
                      >
                        {isActive ? '运行中' : '已停用'}
                      </Tag>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#f8fbff',
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      color: '#666',
                    }}
                  >
                    <div style={{ marginBottom: 4, color: '#999', fontSize: 11 }}>Bot Token</div>
                    <code style={{ color: '#8e6bb0' }}>{bot.token.substring(0, 8)}...</code>
                  </div>

                  <div>
                    <div style={{ marginBottom: 6, color: '#999', fontSize: 11 }}>订阅事件</div>
                    <Space size={[4, 4]} wrap>
                      {bot.eventSubscriptions.length > 0 ? (
                        bot.eventSubscriptions.map((ev) => (
                          <Tag
                            key={ev}
                            color="blue"
                            style={{ fontSize: 11, borderRadius: 8, margin: 0 }}
                          >
                            {ev}
                          </Tag>
                        ))
                      ) : (
                        <Tag
                          color="default"
                          style={{ fontSize: 11, borderRadius: 8, margin: 0 }}
                        >
                          暂无订阅
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px dashed #eef3f8',
                      paddingTop: 10,
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Switch
                        checked={isActive}
                        onChange={(checked) => toggleStatus(bot.id, checked)}
                        size="small"
                      />
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {isActive ? '启用' : '停用'}
                      </span>
                    </div>
                    <Space size={4}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(bot)}
                        style={{ color: '#4A90D9', padding: '0 6px' }}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除吗？"
                        onConfirm={() => handleDelete(bot.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ padding: '0 6px' }}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

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
