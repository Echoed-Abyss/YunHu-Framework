import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';
import { PluginGatewayService } from '../plugin-gateway/plugin-gateway.service';

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
    byApi: Record<string, any>;
  };
  server: {
    uptime: number;
    timestamp: number;
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private startTime: number = Date.now();
  private recentMessages: Array<{
    id: string;
    type: string;
    content: string;
    timestamp: number;
    source: string;
  }> = [];

  constructor(
    private readonly tcpServerService: TcpServerService,
    private readonly eventDispatcherService: EventDispatcherService,
    private readonly pluginGatewayService: PluginGatewayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getStats(): DashboardStats {
    const connections = this.tcpServerService.getAllConnections();
    const authenticatedCount = connections.filter((c) => c.isAuthenticated).length;

    return {
      plugins: {
        total: connections.length,
        authenticated: authenticatedCount,
      },
      events: {
        total: this.eventDispatcherService.getTotalEvents(),
        byType: this.eventDispatcherService.getEventStats(),
      },
      requests: {
        total: this.pluginGatewayService.getTotalRequests(),
        byApi: this.pluginGatewayService.getRequestStats(),
      },
      server: {
        uptime: Date.now() - this.startTime,
        timestamp: Date.now(),
      },
    };
  }

  getRecentLogs(limit: number = 50) {
    return this.recentMessages.slice(-limit).reverse();
  }

  @OnEvent('plugin.request')
  onPluginRequest(event: any) {
    this.addLog({
      id: event.requestId,
      type: 'plugin_request',
      content: `${event.pluginId} -> ${event.apiName}`,
      timestamp: Date.now(),
      source: 'plugin',
    });
  }

  @OnEvent('plugin.connected')
  onPluginConnected(event: any) {
    this.addLog({
      id: event.sessionId,
      type: 'plugin_connected',
      content: `New connection from ${event.remoteAddress}:${event.remotePort}`,
      timestamp: event.connectedAt,
      source: 'system',
    });
  }

  @OnEvent('plugin.authenticated')
  onPluginAuthenticated(event: any) {
    this.addLog({
      id: event.sessionId,
      type: 'plugin_authenticated',
      content: `Plugin authenticated: ${event.pluginName} (${event.pluginId})`,
      timestamp: Date.now(),
      source: 'plugin',
    });
  }

  @OnEvent('plugin.disconnected')
  onPluginDisconnected(event: any) {
    this.addLog({
      id: event.sessionId,
      type: 'plugin_disconnected',
      content: `Plugin disconnected: ${event.pluginName || 'unknown'}`,
      timestamp: Date.now(),
      source: 'system',
    });
  }

  @OnEvent('yunhu.event')
  onYunhuEvent(event: any) {
    this.addLog({
      id: event.eventId,
      type: 'yunhu_event',
      content: `Yunhu event: ${event.eventType}`,
      timestamp: event.eventTime,
      source: 'yunhu',
    });
  }

  private addLog(log: {
    id: string;
    type: string;
    content: string;
    timestamp: number;
    source: string;
  }) {
    this.recentMessages.push(log);
    if (this.recentMessages.length > 500) {
      this.recentMessages.shift();
    }
  }
}
