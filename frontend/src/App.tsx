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

const { darkAlgorithm } = theme;

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
        },
        components: {
          Layout: {
            bodyBg: '#141414',
            headerBg: '#1f1f1f',
            siderBg: '#1f1f1f',
          },
          Card: {
            headerBg: '#1f1f1f',
          },
          Table: {
            headerBg: '#1f1f1f',
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
