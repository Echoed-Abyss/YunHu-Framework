import { Controller, Post, Body, Query, Get, Param } from '@nestjs/common';
import { YunhuApiService, SendMessageParams, EditMessageParams } from './yunhu-api.service';

@Controller('api/yunhu')
export class YunhuController {
  constructor(private readonly yunhuApiService: YunhuApiService) {}

  @Post('send')
  async sendMessage(
    @Query('token') token: string,
    @Body() params: SendMessageParams,
  ) {
    return this.yunhuApiService.sendMessage(token, params);
  }

  @Post('edit')
  async editMessage(
    @Query('token') token: string,
    @Body() params: EditMessageParams,
  ) {
    return this.yunhuApiService.editMessage(token, params);
  }

  @Post('recall')
  async recallMessage(
    @Query('token') token: string,
    @Body() params: { msgId: string; recvId: string; recvType: string },
  ) {
    return this.yunhuApiService.recallMessage(token, {
      msgId: params.msgId,
      recvId: params.recvId,
      recvType: params.recvType as 'user' | 'group',
    });
  }

  @Get('messages')
  async getMessages(
    @Query('token') token: string,
    @Query('chatId') chatId: string,
    @Query('chatType') chatType: string,
    @Query('msgId') msgId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.yunhuApiService.getMessageList(token, {
      chatId,
      chatType: chatType as 'user' | 'group',
      msgId,
      limit,
    });
  }

  @Post('board')
  async setBoard(
    @Query('token') token: string,
    @Body() params: { contentType: string; content: string; expireTime?: number; userId?: string; global?: boolean },
  ) {
    return this.yunhuApiService.setBoard(
      token,
      {
        contentType: params.contentType as 'text' | 'markdown' | 'html',
        content: params.content,
        expireTime: params.expireTime,
        userId: params.userId,
      },
      params.global !== false,
    );
  }

  @Post('board/cancel')
  async unsetBoard(
    @Query('token') token: string,
    @Body() params?: { userId?: string },
  ) {
    return this.yunhuApiService.unsetBoard(token, params?.userId);
  }

  @Get('user/:userId')
  async getUserInfo(
    @Query('token') token: string,
    @Param('userId') userId: string,
  ) {
    return this.yunhuApiService.getUserInfo(token, userId);
  }

  @Get('group/:groupId')
  async getGroupInfo(
    @Query('token') token: string,
    @Param('groupId') groupId: string,
  ) {
    return this.yunhuApiService.getGroupInfo(token, groupId);
  }
}
