import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag } from 'antd';
import {
  CloudServerOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../../api';
import type { DashboardStats, LogEntry } from '../../types';
import dayjs from 'dayjs';

const macaronColors = [
  '#FFB5C5',
  '#A8D8FF',
  '#B5E8C5',
  '#D4B5E8',
  '#FFE8B5',
  '#FFD4A8',
  '#A8E8E8',
  '#C9D4FF',
];

interface StatCardConfig {
  title: string;
  value: string | number;
  suffix?: React.ReactNode;
  icon: React.ReactNode;
  gradient: string;
  iconColor: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [eventTrend, setEventTrend] = useState<{ time: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getLogs(20),
      ]);
      setStats(statsData);
      setRecentLogs(logsData.logs);

      setEventTrend((prev) => {
        const newPoint = {
          time: dayjs().format('HH:mm:ss'),
          count: statsData.events.total,
        };
        const updated = [...prev, newPoint];
        if (updated.length > 20) updated.shift();
        return updated;
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  const getEventChartOption = () => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8eef5',
      borderWidth: 1,
      textStyle: { color: '#555' },
      extraCssText: 'box-shadow: 0 2px 12px rgba(74, 144, 217, 0.12); border-radius: 12px;',
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: eventTrend.map((d) => d.time),
      axisLine: { lineStyle: { color: '#d6e0ea' } },
      axisLabel: { color: '#888' },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#eef3f8', type: 'dashed' } },
    },
    series: [
      {
        name: '事件总数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: eventTrend.map((d) => d.count),
        lineStyle: { color: '#4A90D9', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168, 216, 255, 0.5)' },
              { offset: 1, color: 'rgba(168, 216, 255, 0.02)' },
            ],
          },
        },
        itemStyle: {
          color: '#4A90D9',
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    ],
  });

  const getEventTypeChartOption = () => {
    const eventTypes = stats?.events.byType || {};
    const data = Object.entries(eventTypes).map(([name, value], idx) => ({
      name,
      value,
      itemStyle: { color: macaronColors[idx % macaronColors.length] },
    }));

    return {
      color: macaronColors,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8eef5',
        borderWidth: 1,
        textStyle: { color: '#555' },
        extraCssText: 'box-shadow: 0 2px 12px rgba(74, 144, 217, 0.12); border-radius: 12px;',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#666' },
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
      },
      series: [
        {
          name: '事件类型分布',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#333',
            },
            scaleSize: 6,
          },
          data,
        },
      ],
    };
  };

  const getApiUsageChartOption = () => {
    const apis = stats?.requests.byApi || {};
    const data = Object.entries(apis)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8eef5',
        borderWidth: 1,
        textStyle: { color: '#555' },
        extraCssText: 'box-shadow: 0 2px 12px rgba(74, 144, 217, 0.12); border-radius: 12px;',
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#888' },
        splitLine: { lineStyle: { color: '#eef3f8', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: data.map((d) => d[0]),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#666' },
      },
      series: [
        {
          name: '调用次数',
          type: 'bar',
          data: data.map((d, idx) => ({
            value: d[1].count,
            itemStyle: { color: macaronColors[idx % macaronColors.length] },
          })),
          barWidth: '55%',
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
          },
        },
      ],
    };
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天 ${hours % 24}小时`;
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
    return `${seconds}秒`;
  };

  const getLogBubbleColor = (source: string) => {
    switch (source) {
      case 'yunhu':
        return { bg: 'rgba(181, 232, 197, 0.4)', text: '#3fae5f', emoji: '🌿' };
      case 'plugin':
        return { bg: 'rgba(168, 216, 255, 0.4)', text: '#3a7fbf', emoji: '🔌' };
      case 'system':
        return { bg: 'rgba(255, 232, 181, 0.4)', text: '#c9912f', emoji: '⚙️' };
      default:
        return { bg: 'rgba(212, 181, 232, 0.4)', text: '#8e6bb0', emoji: '✨' };
    }
  };

  const statCards: StatCardConfig[] = [
    {
      title: '在线插件',
      value: stats?.plugins.total || 0,
      suffix: <Tag color="green" style={{ borderRadius: 10 }}>已认证 {stats?.plugins.authenticated || 0}</Tag>,
      icon: <CloudServerOutlined />,
      gradient: 'linear-gradient(135deg, #A8D8FF 0%, #4A90D9 100%)',
      iconColor: '#fff',
    },
    {
      title: '事件总数',
      value: stats?.events.total || 0,
      icon: <ThunderboltOutlined />,
      gradient: 'linear-gradient(135deg, #D4B5E8 0%, #b388e8 100%)',
      iconColor: '#fff',
    },
    {
      title: 'API调用',
      value: stats?.requests.total || 0,
      icon: <ApiOutlined />,
      gradient: 'linear-gradient(135deg, #B5E8C5 0%, #5bc485 100%)',
      iconColor: '#fff',
    },
    {
      title: '运行时长',
      value: stats ? formatUptime(stats.server.uptime) : '-',
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #FFB5C5 0%, #ff8aa3 100%)',
      iconColor: '#fff',
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {statCards.map((card, idx) => (
          <Col xs={24} sm={12} md={6} key={idx}>
            <div
              className="yh-hover-card"
              style={{
                borderRadius: 16,
                padding: 20,
                background: card.gradient,
                boxShadow: '0 4px 16px rgba(74, 144, 217, 0.12)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 110,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  fontSize: 70,
                  opacity: 0.18,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {React.cloneElement(card.icon as React.ReactElement, {
                  style: { fontSize: 70 },
                })}
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.iconColor,
                  fontSize: 20,
                  marginBottom: 8,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {card.icon}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, marginBottom: 4 }}>
                {card.title}
              </div>
              <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{card.value}</div>
              {card.suffix && (
                <div style={{ marginTop: 6 }}>
                  {React.cloneElement(card.suffix as React.ReactElement<{ style?: React.CSSProperties }>, {
                    style: { borderRadius: 10, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff' },
                  })}
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ color: '#333' }}>
                <span style={{ marginRight: 6 }}>📈</span>事件趋势
              </span>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
            headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
          >
            <ReactECharts option={getEventChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ color: '#333' }}>
                <span style={{ marginRight: 6 }}>🍩</span>事件类型分布
              </span>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
            headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
          >
            <ReactECharts option={getEventTypeChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span style={{ color: '#333' }}>
                <span style={{ marginRight: 6 }}>📊</span>API调用排行
              </span>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
            headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
          >
            <ReactECharts option={getApiUsageChartOption()} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ color: '#333' }}>
                <span style={{ marginRight: 6 }}>💬</span>最近日志
              </span>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
            headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: 4 }}>
              {recentLogs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 8 }}>
                    <ellipse cx="24" cy="38" rx="14" ry="3" fill="#e8eef5" />
                    <circle cx="24" cy="22" r="12" fill="#f0f4fa" />
                    <circle cx="20" cy="20" r="1.5" fill="#c9d8e8" />
                    <circle cx="28" cy="20" r="1.5" fill="#c9d8e8" />
                    <path d="M20 26c2 2 6 2 8 0" stroke="#c9d8e8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                  <div style={{ fontSize: 12 }}>暂无日志</div>
                </div>
              )}
              {recentLogs.map((item, idx) => {
                const bubble = getLogBubbleColor(item.source);
                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      alignItems: 'flex-start',
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: bubble.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {bubble.emoji}
                    </div>
                    <div
                      style={{
                        background: bubble.bg,
                        padding: '8px 12px',
                        borderRadius: '4px 14px 14px 14px',
                        flex: 1,
                        boxShadow: '0 1px 4px rgba(74, 144, 217, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
                        {item.content}
                      </div>
                      <div style={{ fontSize: 11, color: bubble.text, marginTop: 4 }}>
                        <span style={{ fontWeight: 500 }}>{item.source}</span>
                        {' · '}
                        {dayjs(item.timestamp).format('HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
