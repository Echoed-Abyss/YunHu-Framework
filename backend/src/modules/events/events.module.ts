import { Module } from '@nestjs/common';
import { EventDispatcherService } from './event-dispatcher.service';
import { TcpServerModule } from '../tcp-server/tcp-server.module';
import { ProtoService } from '../../common/proto/proto.service';

@Module({
  imports: [TcpServerModule],
  providers: [EventDispatcherService, ProtoService],
  exports: [EventDispatcherService],
})
export class EventsModule {}
