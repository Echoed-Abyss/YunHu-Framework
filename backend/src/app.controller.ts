import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  }

  @Get()
  index() {
    return {
      name: 'Yunhu Bot Framework',
      version: '1.0.0',
      description: '云湖机器人插件框架 - TCP + Protobuf + RSA/AES 加密通信',
      docs: '/api',
      health: '/health',
    };
  }
}
