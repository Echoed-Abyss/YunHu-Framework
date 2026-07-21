import { Module } from '@nestjs/common';
import { PluginGatewayService } from './plugin-gateway.service';
import { PluginGatewayController } from './plugin-gateway.controller';
import { TcpServerModule } from '../tcp-server/tcp-server.module';
import { YunhuModule } from '../yunhu/yunhu.module';
import { ProtoService } from '../../common/proto/proto.service';

@Module({
  imports: [TcpServerModule, YunhuModule],
  controllers: [PluginGatewayController],
  providers: [PluginGatewayService, ProtoService],
  exports: [PluginGatewayService],
})
export class PluginGatewayModule {}
