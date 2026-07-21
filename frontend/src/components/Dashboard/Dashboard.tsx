import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Tag, List, Badge, Tooltip } from 'antd';
import {
  CloudServerOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../../api';
import type { DashboardStats, LogEntry } from '../../types';
import dayjs from 'dayjs';

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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: eventTrend.map((d) => d.time),
      axisLine: { lineStyle: { color: '#555' } },
      axisLabel: { color: '#999' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#555' } },
      axisLabel: { color: '#999' },
      splitLine: { lineStyle: { color: '#333' } },
    },
    series: [
      {
        name: '事件总数',
        type: 'line',
        smooth: true,
        data: eventTrend.map((d) => d.count),
        lineStyle: { color: '#1890ff', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
            ],
          },
        },
        itemStyle: { color: '#1890ff' },
      },
    ],
  });

  const getEventTypeChartOption = () => {
    const eventTypes = stats?.events.byType || {};
    const data = Object.entries(eventTypes).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#ccc' },
      },
      series: [
        {
          name: '事件类型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#1f1f1f',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#333' } },
      },
      yAxis: {
        type: 'category',
        data: data.map((d) => d[0]),
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#ccc' },
      },
      series: [
        {
          name: '调用次数',
          type: 'bar',
          data: data.map((d) => d[1].count),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#722ed1' },
                { offset: 1, color: '#1890ff' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
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

  const getLogColor = (source: string) => {
    switch (source) {
      case 'yunhu':
        return '#52c41a';
      case 'plugin':
        return '#1890ff';
      case 'system':
        return '#fa8c16';
      default:
        return '#8c8c8c';
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线插件"
              value={stats?.plugins.total || 0}
              prefix={<CloudServerOutlined style={{ color: '#1890ff' }} />}
              suffix={<Tag color="green">已认证 {stats?.plugins.authenticated || 0}</Tag>}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="事件总数"
              value={stats?.events.total || 0}
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="API调用"
              value={stats?.requests.total || 0}
              prefix={<ApiOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行时长"
              value={stats ? formatUptime(stats.server.uptime) : '-'}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="事件趋势" size="small">
            <ReactECharts
              option={getEventChartOption()}
              style={{ height: 300 }}
              theme="dark"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="事件类型分布" size="small">
            <ReactECharts
              option={getEventTypeChartOption()}
              style={{ height: 300 }}
              theme="dark"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="API调用排行" size="small">
            <ReactECharts
              option={getApiUsageChartOption()}
              style={{ height: 320 }}
              theme="dark"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最近日志" size="small">
            <List
              size="small"
              dataSource={recentLogs}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge color={getLogColor(item.source)} />
                    }
                    title={
                      <span style={{ fontSize: 13, color: '#ccc' }}>
                        {item.content}
                      </span>
                    }
                    description={
                      <span style={{ fontSize: 11, color: '#666' }}>
                        {dayjs(item.timestamp).format('HH:mm:ss')} · {item.source}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
