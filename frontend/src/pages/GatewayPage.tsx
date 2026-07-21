import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Statistic, Row, Col, Button, Space } from 'antd';
import { ApiOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { gatewayApi } from '../api';
import type { ApiInfo } from '../types';

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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      legend: {
        data: ['成功', '失败'],
        textStyle: { color: '#ccc' },
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
          name: '成功',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d[1].success || 0),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'total',
          data: data.map((d) => d[1].fail || 0),
          itemStyle: { color: '#ff4d4f' },
        },
      ],
    };
  };

  const columns = [
    {
      title: 'API名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <ApiOutlined style={{ color: '#1890ff' }} />
          <code style={{ color: '#1890ff' }}>{name}</code>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '调用次数',
      key: 'count',
      render: (_: any, record: ApiInfo) => {
        const apiStat = stats?.byApi[record.name];
        return apiStat ? apiStat.count : 0;
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
          return <span style={{ color: '#888' }}>-</span>;
        }
        const rate = ((apiStat.success / apiStat.count) * 100).toFixed(1);
        return (
          <Progress
            percent={parseFloat(rate)}
            size="small"
            status={parseFloat(rate) >= 90 ? 'success' : parseFloat(rate) >= 70 ? 'normal' : 'exception'}
          />
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="green">可用</Tag>,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总API调用"
              value={stats?.totalRequests || 0}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="可用API"
              value={apis.length}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="成功率"
              value={
                stats && stats.totalRequests > 0
                  ? (
                      (Object.values(stats.byApi).reduce((sum, item: any) => sum + (item.success || 0), 0) /
                        stats.totalRequests) *
                      100
                    ).toFixed(1)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Button
              icon={<ReloadOutlined />}
              block
              onClick={loadData}
            >
              刷新数据
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="API调用成功率统计" size="small">
            <ReactECharts
              option={getSuccessRateChart()}
              style={{ height: 300 }}
              theme="dark"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="插件API列表"
        extra={<Tag color="blue">TCP + Protobuf</Tag>}
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
