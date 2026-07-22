import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  RobotOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  SettingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const CuteLogo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
    }}
  >
    <svg
      width="34"
      height="34"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoCloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8D8FF" />
          <stop offset="100%" stopColor="#4A90D9" />
        </linearGradient>
      </defs>
      <path
        d="M12 32c-3.3 0-6-2.7-6-6 0-2.9 2.1-5.3 4.8-5.9C11.6 14.6 16.3 10 22 10c5 0 9.2 3.5 10.5 8.2.4-.1.8-.1 1.2-.1 4.4 0 8 3.6 8 8s-3.6 8-8 8H12z"
        fill="url(#logoCloud)"
      />
      <circle cx="19" cy="28" r="2.4" fill="#fff" />
      <circle cx="29" cy="28" r="2.4" fill="#fff" />
      <circle cx="19.6" cy="28" r="1.1" fill="#4A90D9" />
      <circle cx="29.6" cy="28" r="1.1" fill="#4A90D9" />
      <path
        d="M22 33c1.2 1.2 2.8 1.2 4 0"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="15.5" cy="24" r="1.4" fill="#FFB5C5" opacity="0.8" />
      <circle cx="32.5" cy="24" r="1.4" fill="#FFB5C5" opacity="0.8" />
    </svg>
    {!collapsed && (
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          background: 'linear-gradient(90deg, #4A90D9, #FFB5C5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          whiteSpace: 'nowrap',
        }}
      >
        云湖机器人
      </span>
    )}
  </div>
);

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/plugins',
      icon: <CloudServerOutlined />,
      label: '插件管理',
    },
    {
      key: '/logs',
      icon: <FileTextOutlined />,
      label: '日志流',
    },
    {
      key: '/gateway',
      icon: <ApiOutlined />,
      label: 'API网关',
    },
    {
      key: '/bots',
      icon: <RobotOutlined />,
      label: '机器人管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#ffffff',
          boxShadow: '2px 0 12px rgba(74, 144, 217, 0.06)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 8px' : '0 20px',
            borderBottom: '1px solid #f0f4fa',
            marginBottom: 8,
          }}
        >
          <CuteLogo collapsed={collapsed} />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderInlineEnd: 'none',
            padding: '0 8px',
          }}
        />
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              textAlign: 'center',
              opacity: 0.6,
            }}
          >
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
              <ellipse cx="20" cy="32" rx="14" ry="4" fill="#A8D8FF" opacity="0.5" />
              <ellipse cx="42" cy="34" rx="12" ry="3" fill="#FFB5C5" opacity="0.5" />
              <circle cx="18" cy="14" r="5" fill="#FFE8B5" opacity="0.7" />
              <path
                d="M16 12c.5-1 1.5-1 2 0"
                stroke="#4A90D9"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(74, 144, 217, 0.06)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
            {menuItems.find((item) => item.key === location.pathname)?.label || '控制台'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(181, 232, 197, 0.25)',
            }}
          >
            <span style={{ color: '#3fae5f', fontSize: 12, fontWeight: 500 }}>
              ● 运行中
            </span>
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            boxShadow: '0 2px 12px rgba(74, 144, 217, 0.06)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
