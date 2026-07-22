import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import PluginManagement from './components/PluginManagement/PluginManagement';
import LogStream from './components/LogStream/LogStream';
import ApiGateway from './pages/GatewayPage';
import BotManagement from './pages/BotPage';
import SettingsPage from './pages/SettingsPage';
import './styles/global.css';

const { defaultAlgorithm } = theme;

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: defaultAlgorithm,
        token: {
          colorPrimary: '#4A90D9',
          borderRadius: 16,
          colorBgLayout: '#f5f7fa',
          colorBgContainer: '#ffffff',
          colorText: '#333333',
          colorTextSecondary: '#555555',
          colorTextTertiary: '#666666',
          colorBorder: '#e8eef5',
          boxShadow: '0 2px 12px rgba(74, 144, 217, 0.08)',
          boxShadowSecondary: '0 4px 16px rgba(74, 144, 217, 0.10)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
        },
        components: {
          Layout: {
            bodyBg: '#f5f7fa',
            headerBg: '#ffffff',
            siderBg: '#ffffff',
          },
          Card: {
            headerBg: '#ffffff',
            boxShadowTertiary: '0 2px 12px rgba(74, 144, 217, 0.08)',
          },
          Table: {
            headerBg: '#f8fbff',
            rowHoverBg: '#f0f7ff',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: 'rgba(74, 144, 217, 0.12)',
            itemSelectedColor: '#4A90D9',
            itemHoverBg: 'rgba(74, 144, 217, 0.06)',
          },
        },
      }}
    >
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plugins" element={<PluginManagement />} />
            <Route path="/logs" element={<LogStream />} />
            <Route path="/gateway" element={<ApiGateway />} />
            <Route path="/bots" element={<BotManagement />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
