import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface YunhuApiResponse<T = any> {
  code: number;
  msg: string;
  message?: string;
  data: T;
}

export interface SendMessageParams {
  recvId: string;
  recvType: 'user' | 'group';
  contentType: 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html';
  content: any;
  parentId?: string;
}

export interface EditMessageParams {
  msgId: string;
  recvId: string;
  recvType: 'user' | 'group';
  contentType: 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html';
  content: any;
}

export interface RecallMessageParams {
  msgId: string;
  recvId: string;
  recvType: 'user' | 'group';
}

export interface SetBoardParams {
  contentType: 'text' | 'markdown' | 'html';
  content: string;
  expireTime?: number;
  userId?: string;
}

export interface GetMessageListParams {
  chatId: string;
  chatType: 'user' | 'group';
  msgId?: string;
  limit?: number;
  newer?: boolean;
}

export interface UploadFileResult {
  fileKey: string;
  fileUrl: string;
}

@Injectable()
export class YunhuApiService {
  private readonly logger = new Logger(YunhuApiService.name);
  private readonly baseUrl = 'https://chat-go.jwzhd.com/open-apis/v1';
  private httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  private getToken(botToken: string): string {
    return botToken;
  }

  async sendMessage(token: string, params: SendMessageParams): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Sending message to ${params.recvType}:${params.recvId}`);
    const response = await this.httpClient.post('/bot/send', params, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async batchSendMessage(token: string, params: {
    userIds: string[];
    contentType: string;
    content: any;
  }): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Batch sending message to ${params.userIds.length} users`);
    const response = await this.httpClient.post('/bot/batch_send', {
      recvIds: params.userIds,
      contentType: params.contentType,
      content: params.content,
    }, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async editMessage(token: string, params: EditMessageParams): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Editing message ${params.msgId}`);
    const response = await this.httpClient.post('/bot/edit', params, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async recallMessage(token: string, params: RecallMessageParams): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Recalling message ${params.msgId}`);
    const response = await this.httpClient.post('/bot/recall', params, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async setBoard(token: string, params: SetBoardParams, global: boolean = true): Promise<YunhuApiResponse<any>> {
    const endpoint = global ? '/bot/board-all' : '/bot/board';
    this.logger.debug(`Setting board (${global ? 'global' : 'user'})`);
    const response = await this.httpClient.post(endpoint, params, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async unsetBoard(token: string, userId?: string): Promise<YunhuApiResponse<any>> {
    const endpoint = userId ? '/bot/board-cancel' : '/bot/board-all-cancel';
    this.logger.debug(`Unsetting board (${userId ? 'user' : 'all'})`);
    const response = await this.httpClient.post(endpoint, userId ? { userId } : {}, {
      params: { token: this.getToken(token) },
    });
    return response.data;
  }

  async getMessageList(token: string, params: GetMessageListParams): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Getting message list for ${params.chatId}`);
    const response = await this.httpClient.get('/bot/messages', {
      params: {
        token: this.getToken(token),
        chatId: params.chatId,
        chatType: params.chatType,
        msgId: params.msgId,
        limit: params.limit,
        newer: params.newer,
      },
    });
    return response.data;
  }

  async uploadImage(token: string, imageData: Buffer, fileName: string): Promise<YunhuApiResponse<UploadFileResult>> {
    this.logger.debug(`Uploading image: ${fileName}`);
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', imageData, fileName);

    const response = await this.httpClient.post('/bot/upload/image', formData, {
      params: { token: this.getToken(token) },
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  }

  async uploadFile(token: string, fileData: Buffer, fileName: string): Promise<YunhuApiResponse<UploadFileResult>> {
    this.logger.debug(`Uploading file: ${fileName}`);
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fileData, fileName);

    const response = await this.httpClient.post('/bot/upload/file', formData, {
      params: { token: this.getToken(token) },
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  }

  async uploadVideo(token: string, videoData: Buffer, fileName: string): Promise<YunhuApiResponse<UploadFileResult>> {
    this.logger.debug(`Uploading video: ${fileName}`);
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', videoData, fileName);

    const response = await this.httpClient.post('/bot/upload/video', formData, {
      params: { token: this.getToken(token) },
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  }

  async getUserInfo(token: string, userId: string): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Getting user info: ${userId}`);
    const response = await this.httpClient.get('/bot/user/info', {
      params: {
        token: this.getToken(token),
        userId,
      },
    });
    return response.data;
  }

  async getGroupInfo(token: string, groupId: string): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Getting group info: ${groupId}`);
    const response = await this.httpClient.get('/bot/group/info', {
      params: {
        token: this.getToken(token),
        groupId,
      },
    });
    return response.data;
  }

  async getGroupMembers(token: string, groupId: string): Promise<YunhuApiResponse<any>> {
    this.logger.debug(`Getting group members: ${groupId}`);
    const response = await this.httpClient.get('/bot/group/members', {
      params: {
        token: this.getToken(token),
        groupId,
      },
    });
    return response.data;
  }
}
