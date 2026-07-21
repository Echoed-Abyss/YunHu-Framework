import { Module, forwardRef } from '@nestjs/common';
import { YunhuApiService } from './yunhu-api.service';
import { YunhuWebhookController } from './yunhu-webhook.controller';
import { YunhuController } from './yunhu.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [forwardRef(() => EventsModule)],
  controllers: [YunhuWebhookController, YunhuController],
  providers: [YunhuApiService],
  exports: [YunhuApiService],
})
export class YunhuModule {}
