import axios from 'axios';
import type { PluginInfo, DashboardStats, LogEntry, ApiInfo } from '../types';

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const dashboardApi = {
  getStats: (): Promise<DashboardStats> =>
    http.get('/dashboard/stats').then((r) => r.data),

  getLogs: (limit = 50): Promise<{ logs: LogEntry[] }> =>
    http.get('/dashboard/logs', { params: { limit } }).then((r) => r.data),

  getStatsStreamUrl: (): string => '/api/dashboard/stream',
  getLogsStreamUrl: (): string => '/api/dashboard/logs/stream',
};

export const pluginApi = {
  getPlugins: (): Promise<{ total: number; plugins: PluginInfo[] }> =>
    http.get('/plugins').then((r) => r.data),

  getPlugin: (sessionId: string): Promise<PluginInfo> =>
    http.get(`/plugins/${sessionId}`).then((r) => r.data),

  getCount: (): Promise<{ total: number }> =>
    http.get('/plugins/count').then((r) => r.data),

  getRSAPublicKey: (): Promise<{ publicKey: string }> =>
    http.get('/plugins/rsa/public-key').then((r) => r.data),
};

export const gatewayApi = {
  getStats: (): Promise<{ totalRequests: number; byApi: Record<string, any> }> =>
    http.get('/gateway/stats').then((r) => r.data),

  getAvailableApis: (): Promise<{ apis: ApiInfo[] }> =>
    http.get('/gateway/apis').then((r) => r.data),
};

export default http;
