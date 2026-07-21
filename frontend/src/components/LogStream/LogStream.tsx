import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Tag, List, Badge, Space, Tooltip, Input } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../../api';
import type { LogEntry } from '../../types';
import dayjs from 'dayjs';

const { Option } = Select;

const LogStream: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadInitialLogs();
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isStreaming) {
      startStreaming();
    } else {
      if (streamRef.current) {
        streamRef.current.close();
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, [isStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const loadInitialLogs = async () => {
    try {
      const data = await dashboardApi.getLogs(200);
      setLogs(data.logs.reverse());
    } catch (err) {
      console.error('Failed to load logs', err);
    }
  };

  const startStreaming = () => {
    if (typeof EventSource === 'undefined') return;

    try {
      const source = new EventSource('/api/dashboard/logs/stream');
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.logs && data.logs.length > 0) {
            setLogs((prev) => {
              const newLogs = [...prev, ...data.logs];
              return newLogs.slice(-500);
            });
          }
        } catch (e) {
          // ignore parse errors
        }
      };
      source.onerror = () => {
        // retry on error
      };
      streamRef.current = source;
    } catch (err) {
      console.error('Failed to start log stream', err);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (source: string) => {
    switch (source) {
      case 'yunhu':
        return 'green';
      case 'plugin':
        return 'blue';
      case 'system':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'plugin_connected':
        return <Badge status="processing" />;
      case 'plugin_authenticated':
        return <Badge status="success" />;
      case 'plugin_disconnected':
        return <Badge status="error" />;
      case 'plugin_request':
        return <Badge status="processing" />;
      case 'yunhu_event':
        return <Badge status="warning" />;
      default:
        return <Badge status="default" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSource = filter === 'all' || log.source === filter;
    const matchSearch =
      searchText === '' ||
      log.content.toLowerCase().includes(searchText.toLowerCase()) ||
      log.type.toLowerCase().includes(searchText.toLowerCase());
    return matchSource && matchSearch;
  });

  const exportLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}] [${log.source.toUpperCase()}] [${log.type}] ${log.content}`,
      )
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yunhu-logs-${dayjs().format('YYYYMMDD-HHmmss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={
        <Space>
          <span>实时日志流</span>
          <Tag color={isStreaming ? 'green' : 'default'}>
            {isStreaming ? '● 实时更新中' : '○ 已暂停'}
          </Tag>
          <span style={{ fontSize: 12, color: '#888' }}>
            共 {filteredLogs.length} 条
          </span>
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="搜索日志..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            size="small"
          />
          <Select
            value={filter}
            onChange={setFilter}
            size="small"
            style={{ width: 120 }}
          >
            <Option value="all">全部来源</Option>
            <Option value="yunhu">云湖事件</Option>
            <Option value="plugin">插件请求</Option>
            <Option value="system">系统事件</Option>
          </Select>
          <Tooltip title={isStreaming ? '暂停' : '继续'}>
            <Button
              size="small"
              icon={isStreaming ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => setIsStreaming(!isStreaming)}
            />
          </Tooltip>
          <Tooltip title="清空">
            <Button size="small" icon={<ClearOutlined />} onClick={clearLogs} />
          </Tooltip>
          <Tooltip title="导出">
            <Button size="small" icon={<DownloadOutlined />} onClick={exportLogs} />
          </Tooltip>
        </Space>
      }
      style={{ height: 'calc(100vh - 180px)' }}
      bodyStyle={{ padding: 0, height: '100%' }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontSize: 12,
          background: '#141414',
        }}
      >
        <List
          size="small"
          dataSource={filteredLogs}
          renderItem={(item) => (
            <List.Item
              style={{
                borderBottom: '1px solid #2a2a2a',
                padding: '6px 0',
              }}
            >
              <div style={{ width: '100%', display: 'flex', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>
                  {dayjs(item.timestamp).format('HH:mm:ss.SSS')}
                </span>
                <Tag color={getLogColor(item.source)} style={{ margin: 0 }}>
                  {item.source}
                </Tag>
                <span style={{ color: '#888' }}>{item.type}</span>
                <span style={{ color: '#ddd', flex: 1 }}>{item.content}</span>
              </div>
            </List.Item>
          )}
        />
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>
            暂无日志
          </div>
        )}
      </div>
    </Card>
  );
};

export default LogStream;
