import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import { ProtoService } from '../../common/proto/proto.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

export interface YunhuEvent {
  version: string;
  header: {
    eventId: string;
    eventTime: number;
    eventType: string;
  };
  event: any;
  botToken?: string;
}

@Injectable()
export class EventDispatcherService implements OnModuleInit {
  private readonly logger = new Logger(EventDispatcherService.name);
  private eventStats: Map<string, number> = new Map();
  private totalEvents: number = 0;

  constructor(
    private eventEmitter: EventEmitter2,
    private tcpServerService: TcpServerService,
    private protoService: ProtoService,
  ) {}

  onModuleInit() {
    this.logger.log('Event Dispatcher Service initialized');
  }

  async handleYunhuEvent(botToken: string, event: YunhuEvent): Promise<boolean> {
    this.totalEvents++;
    const eventType = event.header.eventType;

    const current = this.eventStats.get(eventType) || 0;
    this.eventStats.set(eventType, current + 1);

    this.logger.debug(`Received event: ${eventType}, eventId: ${event.header.eventId}`);

    this.eventEmitter.emit('yunhu.event', {
      botToken,
      eventType,
      eventId: event.header.eventId,
      eventTime: event.header.eventTime,
      payload: event.event,
    });

    const botId = this.extractBotId(botToken);

    const eventPayload = this.convertEventToProto(eventType, event.event);

    if (eventPayload) {
      this.tcpServerService.pushEvent(
        botId,
        eventType,
        event.header.eventId,
        event.header.eventTime,
        eventPayload,
      );
    }

    return true;
  }

  private convertEventToProto(eventType: string, eventData: any): Buffer | null {
    try {
      switch (eventType) {
        case 'message.receive.normal':
        case 'message.receive.instruction':
          return this.protoService.encodeEventMessage('MessageReceiveEvent', {
            sender: {
              senderId: eventData.sender?.senderId || '',
              senderType: eventData.sender?.senderType || 'user',
              senderUserLevel: eventData.sender?.senderUserLevel || '',
              senderNickname: eventData.sender?.senderNickname || '',
              senderAvatarUrl: eventData.sender?.senderAvatarUrl || '',
            },
            chat: {
              chatId: eventData.chat?.chatId || '',
              chatType: eventData.chat?.chatType || '',
            },
            message: {
              msgId: eventData.message?.msgId || '',
              parentId: eventData.message?.parentId || '',
              sendTime: eventData.message?.sendTime || 0,
              chatId: eventData.message?.chatId || '',
              chatType: eventData.message?.chatType || '',
              contentType: eventData.message?.contentType || 'text',
              ...this.buildMessageContent(eventData.message),
              instructionId: eventData.message?.instructionId || 0,
              instructionName: eventData.message?.instructionName || '',
              atUserIds: eventData.message?.content?.at || [],
            },
          });

        case 'bot.followed':
          return this.protoService.encodeEventMessage('BotFollowedEvent', {
            user: {
              senderId: eventData.sender?.senderId || eventData.user?.senderId || '',
              senderType: 'user',
              senderUserLevel: '',
              senderNickname: eventData.sender?.senderNickname || eventData.user?.senderNickname || '',
              senderAvatarUrl: eventData.sender?.senderAvatarUrl || eventData.user?.senderAvatarUrl || '',
            },
            followTime: eventData.followTime || Date.now(),
          });

        case 'bot.unfollowed':
          return this.protoService.encodeEventMessage('BotUnfollowedEvent', {
          user: {
            senderId: eventData.sender?.senderId || eventData.user?.senderId || '',
            senderType: 'user',
            senderUserLevel: '',
            senderNickname: eventData.sender?.senderNickname || eventData.user?.senderNickname || '',
            senderAvatarUrl: eventData.sender?.senderAvatarUrl || eventData.user?.senderAvatarUrl || '',
          },
          unfollowTime: eventData.unfollowTime || Date.now(),
        });

        case 'group.join':
          return this.protoService.encodeEventMessage('GroupJoinEvent', {
            user: {
              senderId: eventData.user?.senderId || '',
              senderType: 'user',
              senderUserLevel: '',
              senderNickname: eventData.user?.senderNickname || '',
              senderAvatarUrl: eventData.user?.senderAvatarUrl || '',
            },
            groupId: eventData.groupId || '',
            joinTime: eventData.joinTime || Date.now(),
            operatorId: eventData.operatorId || '',
          });

        case 'group.leave':
          return this.protoService.encodeEventMessage('GroupLeaveEvent', {
            user: {
              senderId: eventData.user?.senderId || '',
              senderType: 'user',
              senderUserLevel: '',
              senderNickname: eventData.user?.senderNickname || '',
              senderAvatarUrl: eventData.user?.senderAvatarUrl || '',
            },
            groupId: eventData.groupId || '',
            leaveTime: eventData.leaveTime || Date.now(),
            operatorId: eventData.operatorId || '',
          });

        case 'button.report.inline':
          return this.protoService.encodeEventMessage('ButtonReportEvent', {
            user: {
              senderId: eventData.sender?.senderId || eventData.user?.senderId || '',
              senderType: 'user',
              senderUserLevel: '',
              senderNickname: eventData.sender?.senderNickname || eventData.user?.senderNickname || '',
              senderAvatarUrl: eventData.sender?.senderAvatarUrl || eventData.user?.senderAvatarUrl || '',
            },
            chat: {
              chatId: eventData.chat?.chatId || '',
              chatType: eventData.chat?.chatType || '',
            },
            messageId: eventData.messageId || eventData.msgId || '',
            buttonValue: eventData.buttonValue || eventData.value || '',
            buttonText: eventData.buttonText || eventData.text || '',
          });

        default:
          this.logger.warn(`Unknown event type: ${eventType}`);
          return null;
      }
    } catch (err) {
      this.logger.error(`Error converting event ${eventType}: ${err.message}`);
      return null;
    }
  }

  private buildMessageContent(message: any): any {
    const contentType = message?.contentType || 'text';
    const content = message?.content || {};

    switch (contentType) {
      case 'text':
        return { text: { text: content.text || '' } };
      case 'image':
        return {
          image: {
            imageUrl: content.imageUrl || '',
            imageName: content.imageName || '',
            imageKey: content.imageKey || '',
            imageWidth: content.imageWidth || 0,
            imageHeight: content.imageHeight || 0,
          },
        };
      case 'file':
        return {
          file: {
            fileName: content.fileName || '',
            fileUrl: content.fileUrl || '',
            fileKey: content.fileKey || '',
            fileSize: content.fileSize || 0,
          },
        };
      case 'video':
        return {
          video: {
            videoUrl: content.videoUrl || '',
            videoDuration: content.videoDuration || 0,
          },
        };
      case 'audio':
        return {
          audio: {
            audioUrl: content.audioUrl || '',
            audioDuration: content.audioDuration || 0,
          },
        };
      case 'markdown':
        return { markdown: { text: content.text || '' } };
      default:
        return { text: { text: JSON.stringify(content) } };
    }
  }

  private extractBotId(token: string): string {
    if (!token) return '';
    return CryptoUtil.md5(token).substring(0, 16);
  }

  getEventStats(): Record<string, number> {
    return Object.fromEntries(this.eventStats);
  }

  getTotalEvents(): number {
    return this.totalEvents;
  }

  resetStats() {
    this.eventStats.clear();
    this.totalEvents = 0;
  }
}
