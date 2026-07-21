import { Module } from '@nestjs/common';
import { TcpServerService } from './tcp-server.service';
import { TcpServerController } from './tcp-server.controller';
import { ProtoService } from '../../common/proto/proto.service';

@Module({
  controllers: [TcpServerController],
  providers: [TcpServerService, ProtoService],
  exports: [TcpServerService],
})
export class TcpServerModule {}
