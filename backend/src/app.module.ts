import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TcpServerModule } from './modules/tcp-server/tcp-server.module';
import { YunhuModule } from './modules/yunhu/yunhu.module';
import { EventsModule } from './modules/events/events.module';
import { PluginGatewayModule } from './modules/plugin-gateway/plugin-gateway.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProtoService } from './common/proto/proto.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot({
      maxListeners: 100,
      ignoreErrors: false,
    }),
    TcpServerModule,
    YunhuModule,
    EventsModule,
    PluginGatewayModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [ProtoService],
})
export class AppModule {}
