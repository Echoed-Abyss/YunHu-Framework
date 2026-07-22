import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Descriptions,
  Badge,
  Tooltip,
  Row,
  Col,
  Input,
  Empty,
  Pagination,
} from 'antd';
import {
  ReloadOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  SearchOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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

  const pagedPlugins = filteredPlugins.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const authenticatedCount = plugins.filter((p) => p.isAuthenticated).length;

  const avatarPalette = [
    { bg: 'rgba(168, 216, 255, 0.35)', color: '#3a7fbf' },
    { bg: 'rgba(255, 181, 197, 0.35)', color: '#d96a86' },
    { bg: 'rgba(181, 232, 197, 0.35)', color: '#3fae5f' },
    { bg: 'rgba(212, 181, 232, 0.35)', color: '#8e6bb0' },
    { bg: 'rgba(255, 232, 181, 0.35)', color: '#c9912f' },
  ];

  const getAvatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
  };

  const statCards = [
    {
      title: '总连接数',
      value: plugins.length,
      icon: <CloudServerOutlined />,
      gradient: 'linear-gradient(135deg, #A8D8FF 0%, #4A90D9 100%)',
    },
    {
      title: '已认证插件',
      value: authenticatedCount,
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #B5E8C5 0%, #5bc485 100%)',
    },
    {
      title: '等待认证',
      value: plugins.length - authenticatedCount,
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #FFE8B5 0%, #f0b94a 100%)',
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((s, idx) => (
          <Col xs={12} sm={6} key={idx}>
            <div
              className="yh-hover-card"
              style={{
                borderRadius: 16,
                padding: 18,
                background: s.gradient,
                boxShadow: '0 4px 16px rgba(74, 144, 217, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                  {s.title}
                </div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>
                  {s.value}
                </div>
              </div>
            </div>
          </Col>
        ))}
        <Col xs={12} sm={6}>
          <div
            className="yh-hover-card"
            style={{
              borderRadius: 16,
              padding: 18,
              background: '#fff',
              boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Button
              icon={<KeyOutlined />}
              block
              onClick={showPublicKey}
              style={{ borderRadius: 12, height: 40 }}
            >
              查看RSA公钥
            </Button>
          </div>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: '#333' }}>
            <span style={{ marginRight: 6 }}>🔌</span>插件连接列表
          </span>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索插件..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 200, borderRadius: 10 }}
              size="small"
              allowClear
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadPlugins}
              loading={loading}
              style={{ borderRadius: 10 }}
            >
              刷新
            </Button>
          </Space>
        }
        style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
        headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
        bodyStyle={{ padding: 16 }}
      >
        {pagedPlugins.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#999' }}>暂无插件连接</span>}
            style={{ padding: 40 }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {pagedPlugins.map((plugin) => {
              const avatar = getAvatarStyle(plugin.pluginName || plugin.pluginId || 'plugin');
              return (
                <Col xs={24} sm={12} lg={8} key={plugin.sessionId}>
                  <div
                    className="yh-hover-card"
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: '#fff',
                      border: '1px solid #f0f4fa',
                      boxShadow: '0 2px 12px rgba(74, 144, 217, 0.06)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: avatar.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: avatar.color,
                          fontSize: 18,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(plugin.pluginName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#333',
                            fontSize: 14,
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
                            {plugin.pluginName || '未命名'}
                          </span>
                          <Tag
                            color="blue"
                            style={{ fontSize: 11, borderRadius: 8, margin: 0 }}
                          >
                            v{plugin.pluginVersion || '0.0.0'}
                          </Tag>
                        </div>
                        <Tooltip title={plugin.pluginId}>
                          <code
                            style={{
                              color: '#4A90D9',
                              fontSize: 11,
                              display: 'block',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {plugin.pluginId || '未认证'}
                          </code>
                        </Tooltip>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Badge
                        status={plugin.isAuthenticated ? 'success' : 'processing'}
                        text={
                          <span style={{ fontSize: 12, color: '#666' }}>
                            {plugin.isAuthenticated ? '已认证' : '连接中'}
                          </span>
                        }
                      />
                      <span style={{ fontSize: 11, color: '#999' }}>
                        {dayjs(plugin.connectedAt).format('MM-DD HH:mm')}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: '#888',
                        fontFamily: 'monospace',
                        background: '#f8fbff',
                        padding: '4px 8px',
                        borderRadius: 8,
                      }}
                    >
                      {plugin.remoteAddress}:{plugin.remotePort}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 22 }}>
                      {plugin.subscribedEvents.length > 0 ? (
                        plugin.subscribedEvents.slice(0, 3).map((ev) => (
                          <Tag
                            key={ev}
                            color="purple"
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
                          全部
                        </Tag>
                      )}
                      {plugin.subscribedEvents.length > 3 && (
                        <Tag
                          color="default"
                          style={{ fontSize: 11, borderRadius: 8, margin: 0 }}
                        >
                          +{plugin.subscribedEvents.length - 3}
                        </Tag>
                      )}
                    </div>

                    <Button
                      type="link"
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={() => showDetail(plugin)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: 0,
                        color: '#4A90D9',
                      }}
                    >
                      查看详情
                    </Button>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}

        {filteredPlugins.length > pageSize && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPlugins.length}
              onChange={setCurrentPage}
              size="small"
              showTotal={(total) => `共 ${total} 个插件`}
            />
          </div>
        )}
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
            background: '#f8fbff',
            padding: 16,
            borderRadius: 12,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#555',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            border: '1px solid #e8eef5',
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
