import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Descriptions,
  Badge,
  Tooltip,
  Statistic,
  Row,
  Col,
  Input,
} from 'antd';
import {
  ReloadOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { pluginApi } from '../../api';
import type { PluginInfo } from '../../types';
import dayjs from 'dayjs';

const PluginManagement: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [publicKeyVisible, setPublicKeyVisible] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadPlugins();
    const interval = setInterval(loadPlugins, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPlugins = async () => {
    try {
      const data = await pluginApi.getPlugins();
      setPlugins(data.plugins);
    } catch (err) {
      console.error('Failed to load plugins', err);
    }
  };

  const showDetail = (plugin: PluginInfo) => {
    setSelectedPlugin(plugin);
    setDetailVisible(true);
  };

  const showPublicKey = async () => {
    try {
      const data = await pluginApi.getRSAPublicKey();
      setPublicKey(data.publicKey);
      setPublicKeyVisible(true);
    } catch (err) {
      console.error('Failed to get public key', err);
    }
  };

  const filteredPlugins = plugins.filter(
    (p) =>
      p.pluginName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.pluginId.toLowerCase().includes(searchText.toLowerCase()) ||
      p.remoteAddress.includes(searchText),
  );

  const columns = [
    {
      title: '状态',
      dataIndex: 'isAuthenticated',
      key: 'status',
      width: 80,
      render: (authenticated: boolean) => (
        <Badge
          status={authenticated ? 'success' : 'processing'}
          text={authenticated ? '已认证' : '连接中'}
        />
      ),
    },
    {
      title: '插件名称',
      dataIndex: 'pluginName',
      key: 'pluginName',
      render: (name: string, record: PluginInfo) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name || '未命名'}</span>
          <Tag color="blue" style={{ fontSize: 11 }}>
            v{record.pluginVersion || '0.0.0'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '插件ID',
      dataIndex: 'pluginId',
      key: 'pluginId',
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ color: '#1890ff', fontSize: 12 }}>
            {id || '未认证'}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '连接地址',
      dataIndex: 'remoteAddress',
      key: 'remoteAddress',
      render: (addr: string, record: PluginInfo) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {addr}:{record.remotePort}
        </span>
      ),
    },
    {
      title: '订阅事件',
      dataIndex: 'subscribedEvents',
      key: 'subscribedEvents',
      render: (events: string[]) => (
        <Space size={[4, 4]} wrap>
          {events.length > 0 ? (
            events.slice(0, 3).map((ev) => (
              <Tag key={ev} color="purple" style={{ fontSize: 11 }}>
                {ev}
              </Tag>
            ))
          ) : (
            <Tag color="default" style={{ fontSize: 11 }}>
              全部
            </Tag>
          )}
          {events.length > 3 && (
            <Tag color="default" style={{ fontSize: 11 }}>
              +{events.length - 3}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '连接时间',
      dataIndex: 'connectedAt',
      key: 'connectedAt',
      render: (time: number) => (
        <span style={{ fontSize: 12, color: '#888' }}>
          {dayjs(time).format('MM-DD HH:mm:ss')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: PluginInfo) => (
        <Button
          type="link"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const authenticatedCount = plugins.filter((p) => p.isAuthenticated).length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总连接数"
              value={plugins.length}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已认证插件"
              value={authenticatedCount}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="等待认证"
              value={plugins.length - authenticatedCount}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Button
              icon={<KeyOutlined />}
              block
              onClick={showPublicKey}
            >
              查看RSA公钥
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        title="插件连接列表"
        extra={
          <Space>
            <Input
              placeholder="搜索插件..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              size="small"
              allowClear
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadPlugins}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredPlugins}
          rowKey="sessionId"
          size="small"
          loading={loading}
          pagination={{
            pageSize: 10,
            size: 'small',
          }}
        />
      </Card>

      <Modal
        title="插件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedPlugin && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="会话ID">
              <code>{selectedPlugin.sessionId}</code>
            </Descriptions.Item>
            <Descriptions.Item label="插件名称">
              {selectedPlugin.pluginName || '未命名'}
            </Descriptions.Item>
            <Descriptions.Item label="插件ID">
              <code>{selectedPlugin.pluginId || '未认证'}</code>
            </Descriptions.Item>
            <Descriptions.Item label="版本">
              v{selectedPlugin.pluginVersion || '0.0.0'}
            </Descriptions.Item>
            <Descriptions.Item label="认证状态">
              <Badge
                status={selectedPlugin.isAuthenticated ? 'success' : 'processing'}
                text={selectedPlugin.isAuthenticated ? '已认证' : '未认证'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="连接地址">
              {selectedPlugin.remoteAddress}:{selectedPlugin.remotePort}
            </Descriptions.Item>
            <Descriptions.Item label="连接时间">
              {dayjs(selectedPlugin.connectedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="最后心跳">
              {dayjs(selectedPlugin.lastHeartbeatAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="订阅事件">
              <Space size={[4, 4]} wrap>
                {selectedPlugin.subscribedEvents.length > 0 ? (
                  selectedPlugin.subscribedEvents.map((ev) => (
                    <Tag key={ev} color="purple">
                      {ev}
                    </Tag>
                  ))
                ) : (
                  <Tag color="default">全部事件</Tag>
                )}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="RSA 公钥"
        open={publicKeyVisible}
        onCancel={() => setPublicKeyVisible(false)}
        footer={[
          <Button
            key="copy"
            onClick={() => {
              navigator.clipboard.writeText(publicKey);
            }}
          >
            复制
          </Button>,
          <Button key="close" onClick={() => setPublicKeyVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <div
          style={{
            background: '#f5f5f5',
            padding: 16,
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 12,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          {publicKey || '加载中...'}
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
          插件客户端需要使用此公钥加密AES密钥，完成安全握手。
        </p>
      </Modal>
    </div>
  );
};

export default PluginManagement;
