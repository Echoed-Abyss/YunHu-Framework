import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Row, Col, Button } from 'antd';
import { ApiOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { gatewayApi } from '../api';
import type { ApiInfo } from '../types';

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

const ApiGateway: React.FC = () => {
  const [apis, setApis] = useState<ApiInfo[]>([]);
  const [stats, setStats] = useState<{ totalRequests: number; byApi: Record<string, any> } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [apiData, statsData] = await Promise.all([
        gatewayApi.getAvailableApis(),
        gatewayApi.getStats(),
      ]);
      setApis(apiData.apis);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load gateway data', err);
    }
  };

  const getSuccessRateChart = () => {
    const byApi = stats?.byApi || {};
    const data = Object.entries(byApi)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8);

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
      legend: {
        data: ['成功', '失败'],
        textStyle: { color: '#666' },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
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
          name: '成功',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d[1].success || 0),
          itemStyle: {
            color: '#B5E8C5',
            borderRadius: [8, 0, 0, 8],
          },
          barWidth: '55%',
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d[1].fail || 0),
          itemStyle: {
            color: '#FFB5C5',
            borderRadius: [0, 8, 8, 0],
          },
          barWidth: '55%',
        },
      ],
    };
  };

  const columns = [
    {
      title: 'API名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, _record: ApiInfo, idx: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: macaronColors[idx % macaronColors.length],
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
            }}
          >
            <ApiOutlined />
          </span>
          <code style={{ color: '#4A90D9' }}>{name}</code>
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span style={{ color: '#666' }}>{desc}</span>,
    },
    {
      title: '调用次数',
      key: 'count',
      render: (_: any, record: ApiInfo) => {
        const apiStat = stats?.byApi[record.name];
        return (
          <span style={{ fontWeight: 600, color: '#333' }}>
            {apiStat ? apiStat.count : 0}
          </span>
        );
      },
      sorter: (a: ApiInfo, b: ApiInfo) => {
        const aCount = stats?.byApi[a.name]?.count || 0;
        const bCount = stats?.byApi[b.name]?.count || 0;
        return aCount - bCount;
      },
    },
    {
      title: '成功率',
      key: 'successRate',
      render: (_: any, record: ApiInfo) => {
        const apiStat = stats?.byApi[record.name];
        if (!apiStat || apiStat.count === 0) {
          return <span style={{ color: '#aaa' }}>-</span>;
        }
        const rate = ((apiStat.success / apiStat.count) * 100).toFixed(1);
        return (
          <Progress
            percent={parseFloat(rate)}
            size="small"
            strokeColor={{
              '0%': '#B5E8C5',
              '100%': '#5bc485',
            }}
            trailColor="#f0f4fa"
            status={parseFloat(rate) >= 90 ? 'success' : parseFloat(rate) >= 70 ? 'normal' : 'exception'}
          />
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="green" style={{ borderRadius: 10 }}>可用</Tag>,
    },
  ];

  const statCards = [
    {
      title: '总API调用',
      value: stats?.totalRequests || 0,
      gradient: 'linear-gradient(135deg, #A8D8FF 0%, #4A90D9 100%)',
    },
    {
      title: '可用API',
      value: apis.length,
      gradient: 'linear-gradient(135deg, #B5E8C5 0%, #5bc485 100%)',
    },
    {
      title: '成功率',
      value:
        stats && stats.totalRequests > 0
          ? (
              (Object.values(stats.byApi).reduce((sum, item: any) => sum + (item.success || 0), 0) /
                stats.totalRequests) *
              100
            ).toFixed(1)
          : 0,
      suffix: '%',
      gradient: 'linear-gradient(135deg, #FFB5C5 0%, #ff8aa3 100%)',
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
                minHeight: 80,
              }}
            >
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                {s.title}
              </div>
              <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginTop: 4 }}>
                {s.value}
                {s.suffix && <span style={{ fontSize: 16, marginLeft: 2 }}>{s.suffix}</span>}
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
              icon={<ReloadOutlined />}
              block
              onClick={loadData}
              style={{ borderRadius: 12, height: 40 }}
            >
              刷新数据
            </Button>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card
            title={
              <span style={{ color: '#333' }}>
                <span style={{ marginRight: 6 }}>📊</span>API调用成功率统计
              </span>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
            headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
          >
            <ReactECharts option={getSuccessRateChart()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ color: '#333' }}>
            <span style={{ marginRight: 6 }}>🛰️</span>插件API列表
          </span>
        }
        extra={<Tag color="blue" style={{ borderRadius: 10 }}>TCP + Protobuf</Tag>}
        style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)' }}
        headStyle={{ borderBottom: '1px solid #f0f4fa', borderRadius: '16px 16px 0 0' }}
      >
        <Table
          columns={columns}
          dataSource={apis}
          rowKey="name"
          size="small"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ApiGateway;
