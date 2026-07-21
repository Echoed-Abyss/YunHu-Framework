import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TcpServerModule } from '../tcp-server/tcp-server.module';
import { EventsModule } from '../events/events.module';
import { PluginGatewayModule } from '../plugin-gateway/plugin-gateway.module';

@Module({
  imports: [TcpServerModule, EventsModule, PluginGatewayModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
