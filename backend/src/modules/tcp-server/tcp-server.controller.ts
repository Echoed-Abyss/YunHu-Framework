import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';

@Controller('api/plugins')
export class TcpServerController {
  constructor(private readonly tcpServerService: TcpServerService) {}

  @Get()
  getPlugins() {
    const connections = this.tcpServerService.getAllConnections();
    return {
      total: connections.length,
      plugins: connections.map((conn) => ({
        sessionId: conn.sessionId,
        pluginId: conn.pluginId,
        pluginName: conn.pluginName,
        pluginVersion: conn.pluginVersion,
        isAuthenticated: conn.isAuthenticated,
        subscribedEvents: conn.subscribedEvents,
        connectedAt: conn.connectedAt,
        lastHeartbeatAt: conn.lastHeartbeatAt,
        remoteAddress: conn.remoteAddress,
        remotePort: conn.remotePort,
      })),
    };
  }

  @Get('count')
  getPluginCount() {
    return {
      total: this.tcpServerService.getConnectionCount(),
    };
  }

  @Get(':sessionId')
  getPlugin(@Param('sessionId') sessionId: string) {
    const conn = this.tcpServerService.getConnection(sessionId);
    if (!conn) {
      return { error: 'Plugin not found' };
    }
    return {
      sessionId: conn.sessionId,
      pluginId: conn.pluginId,
      pluginName: conn.pluginName,
      pluginVersion: conn.pluginVersion,
      isAuthenticated: conn.isAuthenticated,
      subscribedEvents: conn.subscribedEvents,
      connectedAt: conn.connectedAt,
      lastHeartbeatAt: conn.lastHeartbeatAt,
      remoteAddress: conn.remoteAddress,
      remotePort: conn.remotePort,
    };
  }

  @Get('rsa/public-key')
  getRSAPublicKey() {
    return {
      publicKey: this.tcpServerService.getRSAPublicKey(),
    };
  }
}
