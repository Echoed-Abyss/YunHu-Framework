import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import { YunhuApiService } from '../yunhu/yunhu-api.service';
import { ProtoService } from '../../common/proto/proto.service';

export interface PluginRequestEvent {
  sessionId: string;
  pluginId: string;
  botToken: string;
  requestId: string;
  apiName: string;
  metadata: Record<string, string>;
  parameters: Buffer;
}

@Injectable()
export class PluginGatewayService implements OnModuleInit {
  private readonly logger = new Logger(PluginGatewayService.name);
  private requestStats: Map<string, { count: number; success: number; fail: number }> = new Map();

  constructor(
    private readonly tcpServerService: TcpServerService,
    private readonly yunhuApiService: YunhuApiService,
    private readonly protoService: ProtoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('Plugin API Gateway initialized');
  }

  @OnEvent('plugin.request')
  async handlePluginRequest(event: PluginRequestEvent) {
    this.logger.debug(`Processing plugin request: ${event.apiName}, requestId: ${event.requestId}`);

    this.updateStats(event.apiName, 'total');

    try {
      let result: any;

      switch (event.apiName) {
        case 'SendMessage':
          result = await this.handleSendMessage(event);
          break;
        case 'EditMessage':
          result = await this.handleEditMessage(event);
          break;
        case 'RecallMessage':
          result = await this.handleRecallMessage(event);
          break;
        case 'BatchSendMessage':
          result = await this.handleBatchSendMessage(event);
          break;
        case 'SetBoard':
          result = await this.handleSetBoard(event);
          break;
        case 'UnsetBoard':
          result = await this.handleUnsetBoard(event);
          break;
        case 'GetMessageList':
          result = await this.handleGetMessageList(event);
          break;
        case 'GetUserInfo':
          result = await this.handleGetUserInfo(event);
          break;
        case 'GetGroupInfo':
          result = await this.handleGetGroupInfo(event);
          break;
        case 'UploadFile':
          result = await this.handleUploadFile(event);
          break;
        case 'WriteLog':
          result = await this.handleWriteLog(event);
          break;
        default:
          throw new Error(`Unknown API: ${event.apiName}`);
      }

      this.updateStats(event.apiName, 'success');
      this.sendSuccessResponse(event, result);
    } catch (err) {
      this.logger.error(`API ${event.apiName} failed: ${err.message}`);
      this.updateStats(event.apiName, 'fail');
      this.sendErrorResponse(event, 500, err.message);
    }
  }

  private async handleSendMessage(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'SendMessageRequest',
      event.parameters,
    );

    const content = this.buildContent(params);
    const buttons = this.extractButtons(params);

    const response = await this.yunhuApiService.sendMessage(event.botToken, {
      recvId: params.recvId,
      recvType: params.recvType === 'USER' ? 'user' : 'group',
      contentType: this.mapContentType(params.contentType),
      content: {
        ...content,
        ...(buttons && buttons.length > 0 ? { buttons } : {}),
      },
      parentId: params.parentId,
    });

    return this.protoService.encodeApiMessage('SendMessageResponse', {
      msgId: response.data?.msgId || response.data?.messageId || '',
      recvId: params.recvId,
      sendTime: Date.now(),
    });
  }

  private async handleEditMessage(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'EditMessageRequest',
      event.parameters,
    );

    const content = this.buildContent(params);
    const buttons = this.extractButtons(params);

    const response = await this.yunhuApiService.editMessage(event.botToken, {
      msgId: params.msgId,
      recvId: params.recvId,
      recvType: params.recvType === 'USER' ? 'user' : 'group',
      contentType: this.mapContentType(params.contentType),
      content: {
        ...content,
        ...(buttons && buttons.length > 0 ? { buttons } : {}),
      },
    });

    return this.protoService.encodeApiMessage('EditMessageResponse', {
      success: response.code === 0,
      msgId: params.msgId,
    });
  }

  private async handleRecallMessage(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'RecallMessageRequest',
      event.parameters,
    );

    const response = await this.yunhuApiService.recallMessage(event.botToken, {
      msgId: params.msgId,
      recvId: params.recvId,
      recvType: params.recvType === 'USER' ? 'user' : 'group',
    });

    return this.protoService.encodeApiMessage('RecallMessageResponse', {
      success: response.code === 0,
    });
  }

  private async handleBatchSendMessage(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'BatchSendMessageRequest',
      event.parameters,
    );

    const content = this.buildContent(params);

    const response = await this.yunhuApiService.batchSendMessage(event.botToken, {
      userIds: params.userIds,
      contentType: this.mapContentType(params.contentType),
      content,
    });

    return this.protoService.encodeApiMessage('BatchSendMessageResponse', {
      successCount: response.data?.successCount || params.userIds.length,
      failCount: response.data?.failCount || 0,
      failedUserIds: response.data?.failedUserIds || [],
    });
  }

  private async handleSetBoard(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'SetBoardRequest',
      event.parameters,
    );

    const isGlobal = params.boardType === 'GLOBAL';

    const response = await this.yunhuApiService.setBoard(
      event.botToken,
      {
        contentType: this.mapContentType(params.contentType) as 'text' | 'markdown' | 'html',
        content: params.content,
        expireTime: params.expireTime,
        userId: params.userId,
      },
      isGlobal,
    );

    return this.protoService.encodeApiMessage('SetBoardResponse', {
      success: response.code === 0,
      boardId: response.data?.boardId || '',
    });
  }

  private async handleUnsetBoard(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'UnsetBoardRequest',
      event.parameters,
    );

    const userId = params.boardType === 'USER' ? params.userId : undefined;
    const response = await this.yunhuApiService.unsetBoard(event.botToken, userId);

    return this.protoService.encodeApiMessage('UnsetBoardResponse', {
      success: response.code === 0,
    });
  }

  private async handleGetMessageList(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'GetMessageListRequest',
      event.parameters,
    );

    const response = await this.yunhuApiService.getMessageList(event.botToken, {
      chatId: params.chatId,
      chatType: params.chatType === 'USER' ? 'user' : 'group',
      msgId: params.msgId,
      limit: params.limit,
      newer: params.newer,
    });

    const messages = (response.data?.messages || []).map((msg: any) => ({
      msgId: msg.msgId,
      sendTime: msg.sendTime,
      senderId: msg.senderId || msg.sender?.senderId || '',
      contentType: msg.contentType,
      content: Buffer.from(JSON.stringify(msg.content || {})),
    }));

    return this.protoService.encodeApiMessage('GetMessageListResponse', {
      messages,
      hasMore: response.data?.hasMore || false,
    });
  }

  private async handleGetUserInfo(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'GetUserInfoRequest',
      event.parameters,
    );

    const response = await this.yunhuApiService.getUserInfo(event.botToken, params.userId);

    return this.protoService.encodeApiMessage('GetUserInfoResponse', {
      userId: response.data?.userId || params.userId,
      nickname: response.data?.nickname || response.data?.senderNickname || '',
      avatarUrl: response.data?.avatarUrl || response.data?.senderAvatarUrl || '',
    });
  }

  private async handleGetGroupInfo(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'GetGroupInfoRequest',
      event.parameters,
    );

    const response = await this.yunhuApiService.getGroupInfo(event.botToken, params.groupId);

    return this.protoService.encodeApiMessage('GetGroupInfoResponse', {
      groupId: response.data?.groupId || params.groupId,
      groupName: response.data?.groupName || '',
      groupAvatar: response.data?.groupAvatar || '',
      memberCount: response.data?.memberCount || 0,
      ownerId: response.data?.ownerId || '',
    });
  }

  private async handleUploadFile(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'UploadFileRequest',
      event.parameters,
    );

    let response;
    const fileData = Buffer.isBuffer(params.fileData) ? params.fileData : Buffer.from(params.fileData);

    if (params.fileType === 'image') {
      response = await this.yunhuApiService.uploadImage(
        event.botToken,
        fileData,
        params.fileName,
      );
    } else if (params.fileType === 'video') {
      response = await this.yunhuApiService.uploadVideo(
        event.botToken,
        fileData,
        params.fileName,
      );
    } else {
      response = await this.yunhuApiService.uploadFile(
        event.botToken,
        fileData,
        params.fileName,
      );
    }

    return this.protoService.encodeApiMessage('UploadFileResponse', {
      fileKey: response.data?.fileKey || '',
      fileUrl: response.data?.fileUrl || '',
      fileSize: response.data?.fileSize || fileData.length,
    });
  }

  private async handleWriteLog(event: PluginRequestEvent): Promise<Buffer> {
    const params = this.protoService.decodeApiMessage(
      'WriteLogRequest',
      event.parameters,
    );

    const levelMap: Record<string, string> = {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
    };

    const level = levelMap[params.level] || 'info';

    this.logger.log(`[${level.toUpperCase()}] [${event.pluginId}] ${params.message}`);

    this.eventEmitter.emit('plugin.log', {
      pluginId: event.pluginId,
      level,
      message: params.message,
      source: params.source || event.pluginId,
      timestamp: Date.now(),
    });

    return this.protoService.encodeApiMessage('WriteLogResponse', {
      success: true,
    });
  }

  private buildContent(params: any): any {
    const contentType = params.contentType;

    switch (contentType) {
      case 'TEXT':
        return { text: params.textContent?.text || '' };
      case 'IMAGE':
        return { imageKey: params.imageContent?.imageKey || '' };
      case 'MARKDOWN':
        return { text: params.markdownContent?.text || '' };
      case 'FILE':
        return { fileKey: params.fileContent?.fileKey || '' };
      case 'VIDEO':
        return { videoKey: params.videoContent?.videoKey || '' };
      case 'HTML':
        return { html: params.htmlContent?.html || '' };
      default:
        return { text: '' };
    }
  }

  private extractButtons(params: any): any[][] | null {
    if (!params.buttons || params.buttons.length === 0) {
      return null;
    }

    return params.buttons.map((row: any) =>
      (row.buttons || []).map((btn: any) => ({
        text: btn.text,
        actionType: this.mapActionType(btn.actionType),
        url: btn.url,
        value: btn.value,
      })),
    );
  }

  private mapContentType(protoType: string): 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html' {
    const map: Record<string, 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html'> = {
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      FILE: 'file',
      MARKDOWN: 'markdown',
      HTML: 'html',
    };
    return map[protoType] || 'text';
  }

  private mapActionType(protoType: string): number {
    const map: Record<string, number> = {
      OPEN_URL: 1,
      COPY: 2,
      REPORT: 3,
    };
    return map[protoType] || 1;
  }

  private sendSuccessResponse(event: PluginRequestEvent, data: Buffer) {
    const connection = this.tcpServerService.getConnection(event.sessionId);
    if (!connection) return;

    this.tcpServerService.sendPluginResponse(
      connection,
      event.requestId,
      true,
      0,
      'success',
      data,
    );
  }

  private sendErrorResponse(event: PluginRequestEvent, code: number, message: string) {
    const connection = this.tcpServerService.getConnection(event.sessionId);
    if (!connection) return;

    this.tcpServerService.sendPluginResponse(
      connection,
      event.requestId,
      false,
      code,
      message,
      Buffer.alloc(0),
    );
  }

  private updateStats(apiName: string, type: 'total' | 'success' | 'fail') {
    const stat = this.requestStats.get(apiName) || { count: 0, success: 0, fail: 0 };
    stat.count++;
    if (type === 'success') stat.success++;
    if (type === 'fail') stat.fail++;
    this.requestStats.set(apiName, stat);
  }

  getRequestStats() {
    const result: Record<string, any> = {};
    for (const [name, stat] of this.requestStats) {
      result[name] = stat;
    }
    return result;
  }

  getTotalRequests(): number {
    let total = 0;
    for (const stat of this.requestStats.values()) {
      total += stat.count;
    }
    return total;
  }
}
