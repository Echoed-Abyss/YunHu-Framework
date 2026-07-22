import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Tag, Space, Tooltip, Input } from 'antd';
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

  const getLogBubble = (source: string) => {
    switch (source) {
      case 'yunhu':
        return {
          dot: '#5bc485',
          tagBg: 'rgba(181, 232, 197, 0.4)',
          emoji: '🌿',
        };
      case 'plugin':
        return {
          dot: '#4A90D9',
          tagBg: 'rgba(168, 216, 255, 0.4)',
          emoji: '🔌',
        };
      case 'system':
        return {
          dot: '#f0b94a',
          tagBg: 'rgba(255, 232, 181, 0.4)',
          emoji: '⚙️',
        };
      default:
        return {
          dot: '#8e6bb0',
          tagBg: 'rgba(212, 181, 232, 0.4)',
          emoji: '✨',
        };
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
          <span style={{ color: '#333' }}>
            <span style={{ marginRight: 6 }}>📜</span>实时日志流
          </span>
          <Tag color={isStreaming ? 'green' : 'default'} style={{ borderRadius: 10 }}>
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
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200, borderRadius: 10 }}
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
      style={{
        height: 'calc(100vh - 180px)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)',
      }}
      headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
      bodyStyle={{ padding: 0, height: '100%' }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '12px 16px',
          background: '#fafbfc',
          borderRadius: '0 0 16px 16px',
        }}
      >
        {filteredLogs.map((item, idx) => {
          const bubble = getLogBubble(item.source);
          const isEven = idx % 2 === 0;
          return (
            <div
              key={item.id || idx}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                padding: '8px 10px',
                marginBottom: 4,
                background: isEven ? '#ffffff' : '#f5f8fc',
                borderRadius: 12,
                borderLeft: `3px solid ${bubble.dot}`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="yh-log-row"
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: bubble.tagBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {bubble.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      color: '#999',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dayjs(item.timestamp).format('HH:mm:ss.SSS')}
                  </span>
                  <Tag
                    color={getLogColor(item.source)}
                    style={{ margin: 0, fontSize: 11, borderRadius: 8 }}
                  >
                    {item.source}
                  </Tag>
                  <span style={{ color: '#aaa', fontSize: 11 }}>{item.type}</span>
                </div>
                <div style={{ color: '#444', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <svg width="64" height="56" viewBox="0 0 64 56" fill="none" style={{ marginBottom: 8 }}>
              <ellipse cx="32" cy="48" rx="18" ry="4" fill="#e8eef5" />
              <rect x="14" y="14" width="36" height="30" rx="8" fill="#f0f4fa" />
              <line x1="22" y1="24" x2="42" y2="24" stroke="#c9d8e8" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="30" x2="38" y2="30" stroke="#c9d8e8" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="36" x2="34" y2="36" stroke="#c9d8e8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="14" r="6" fill="#FFB5C5" opacity="0.6" />
            </svg>
            <div style={{ color: '#999', fontSize: 13 }}>暂无日志</div>
          </div>
        )}
      </div>
      <style>{`
        .yh-log-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(74, 144, 217, 0.12);
        }
      `}</style>
    </Card>
  );
};

export default LogStream;
