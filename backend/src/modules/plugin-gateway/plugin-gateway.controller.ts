import { Controller, Get } from '@nestjs/common';
import { PluginGatewayService } from './plugin-gateway.service';

@Controller('api/gateway')
export class PluginGatewayController {
  constructor(private readonly pluginGatewayService: PluginGatewayService) {}

  @Get('stats')
  getStats() {
    return {
      totalRequests: this.pluginGatewayService.getTotalRequests(),
      byApi: this.pluginGatewayService.getRequestStats(),
    };
  }

  @Get('apis')
  getAvailableApis() {
    return {
      apis: [
        { name: 'SendMessage', description: '发送消息' },
        { name: 'EditMessage', description: '编辑消息' },
        { name: 'RecallMessage', description: '撤回消息' },
        { name: 'BatchSendMessage', description: '批量发送消息' },
        { name: 'SetBoard', description: '设置看板' },
        { name: 'UnsetBoard', description: '取消看板' },
        { name: 'GetMessageList', description: '获取消息列表' },
        { name: 'GetUserInfo', description: '获取用户信息' },
        { name: 'GetGroupInfo', description: '获取群组信息' },
        { name: 'UploadFile', description: '上传文件' },
      ],
    };
  }
}
