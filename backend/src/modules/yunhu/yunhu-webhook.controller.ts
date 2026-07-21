import { Controller, Post, Body, Req, Query, Logger, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { Request } from 'express';
import { EventDispatcherService, YunhuEvent } from '../events/event-dispatcher.service';

@Controller('webhook')
export class YunhuWebhookController {
  private readonly logger = new Logger(YunhuWebhookController.name);

  constructor(private readonly eventDispatcherService: EventDispatcherService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: YunhuEvent,
    @Query('token') token: string,
    @Req() req: Request,
  ) {
    this.logger.debug(`Received webhook event: ${body.header?.eventType}, token: ${token ? '***' : 'missing'}`);

    if (!body || !body.header || !body.header.eventType) {
      this.logger.warn('Invalid webhook payload');
      return { code: 400, msg: 'Invalid payload' };
    }

    const botToken = token || (req.headers['x-bot-token'] as string);

    if (!botToken) {
      this.logger.warn('Missing bot token');
      return { code: 401, msg: 'Missing bot token' };
    }

    try {
      await this.eventDispatcherService.handleYunhuEvent(botToken, body);
      return { code: 0, msg: 'success' };
    } catch (err) {
      this.logger.error(`Error handling webhook: ${err.message}`);
      return { code: 500, msg: err.message };
    }
  }

  @Post(':botId')
  @HttpCode(HttpStatus.OK)
  async handleWebhookWithBotId(
    @Param('botId') botId: string,
    @Body() body: YunhuEvent,
    @Query('token') token: string,
  ) {
    this.logger.debug(`Received webhook event for bot ${botId}: ${body.header?.eventType}`);

    if (!body || !body.header || !body.header.eventType) {
      return { code: 400, msg: 'Invalid payload' };
    }

    const botToken = token || botId;

    try {
      await this.eventDispatcherService.handleYunhuEvent(botToken, body);
      return { code: 0, msg: 'success' };
    } catch (err) {
      this.logger.error(`Error handling webhook: ${err.message}`);
      return { code: 500, msg: err.message };
    }
  }
}
