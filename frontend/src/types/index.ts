export interface PluginInfo {
  sessionId: string;
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  isAuthenticated: boolean;
  subscribedEvents: string[];
  connectedAt: number;
  lastHeartbeatAt: number;
  remoteAddress: string;
  remotePort: number;
}

export interface DashboardStats {
  plugins: {
    total: number;
    authenticated: number;
  };
  events: {
    total: number;
    byType: Record<string, number>;
  };
  requests: {
    total: number;
    byApi: Record<string, { count: number; success: number; fail: number }>;
  };
  server: {
    uptime: number;
    timestamp: number;
  };
}

export interface LogEntry {
  id: string;
  type: string;
  content: string;
  timestamp: number;
  source: string;
}

export interface ApiInfo {
  name: string;
  description: string;
}

export interface YunhuApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}
