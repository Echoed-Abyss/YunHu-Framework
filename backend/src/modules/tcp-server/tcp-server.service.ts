import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { ProtoService } from '../../common/proto/proto.service';
import { PluginConnection, MessageType } from './plugin-connection.interface';

@Injectable()
export class TcpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TcpServerService.name);
  private server: net.Server;
  private connections: Map<string, PluginConnection> = new Map();
  private botPluginMap: Map<string, string[]> = new Map();
  private rsaKeyPair: { publicKey: string; privateKey: string };

  constructor(
    private configService: ConfigService,
    private protoService: ProtoService,
    private eventEmitter: EventEmitter2,
  ) {
    this.rsaKeyPair = CryptoUtil.generateRSAKeyPair(2048);
    this.logger.log('RSA key pair generated');
  }

  onModuleInit() {
    this.startServer();
  }

  onModuleDestroy() {
    this.stopServer();
  }

  private startServer() {
    const port = this.configService.get<number>('TCP_PORT', 8888);
    const host = this.configService.get<string>('TCP_HOST', '0.0.0.0');

    this.server = net.createServer((socket) => this.handleConnection(socket));

    this.server.listen(port, host, () => {
      this.logger.log(`TCP Server listening on ${host}:${port}`);
    });

    this.server.on('error', (err) => {
      this.logger.error(`TCP Server error: ${err.message}`);
    });
  }

  private stopServer() {
    if (this.server) {
      this.server.close();
      this.connections.forEach((conn) => conn.socket.destroy());
      this.connections.clear();
      this.logger.log('TCP Server stopped');
    }
  }

  private handleConnection(socket: net.Socket) {
    const sessionId = uuidv4();
    const remoteAddress = socket.remoteAddress || 'unknown';
    const remotePort = socket.remotePort || 0;

    this.logger.log(`New connection from ${remoteAddress}:${remotePort}, session: ${sessionId}`);

    const connection: PluginConnection = {
      socket,
      pluginId: '',
      pluginName: '',
      pluginVersion: '',
      botToken: '',
      sessionId,
      isAuthenticated: false,
      aesCipher: null,
      subscribedEvents: [],
      connectedAt: Date.now(),
      lastHeartbeatAt: Date.now(),
      heartbeatSeq: 0,
      remoteAddress,
      remotePort,
      buffer: Buffer.alloc(0),
    };

    this.connections.set(sessionId, connection);

    socket.on('data', (data) => this.handleData(connection, data));
    socket.on('end', () => this.handleDisconnect(connection));
    socket.on('error', (err) => this.handleSocketError(connection, err));
    socket.on('close', () => this.handleSocketClose(connection));

    this.eventEmitter.emit('plugin.connected', {
      sessionId,
      remoteAddress,
      remotePort,
      connectedAt: connection.connectedAt,
    });
  }

  private handleData(connection: PluginConnection, data: Buffer) {
    connection.buffer = Buffer.concat([connection.buffer, data]);
    this.logger.debug(`Received raw data: ${data.length} bytes, buffer now: ${connection.buffer.length} bytes`);

    while (connection.buffer.length >= 4) {
      let length: number;
      let messageData: Buffer;
      let hasLengthPrefix = true;

      const firstByte = connection.buffer[0];
      if (connection.buffer.length >= 2) {
        const secondByte = connection.buffer[1];
        if ((firstByte & 0x07) === 0x00 && (firstByte >> 3) === 1 && secondByte >= 1 && secondByte <= 8) {
          hasLengthPrefix = false;
        }
      }

      if (hasLengthPrefix) {
        length = connection.buffer.readUInt32BE(0);
        this.logger.debug(`Message length prefix: ${length}, buffer available: ${connection.buffer.length}`);
        
        if (connection.buffer.length < 4 + length) {
          this.logger.debug(`Waiting for more data, need ${4 + length} but have ${connection.buffer.length}`);
          break;
        }
        messageData = connection.buffer.slice(4, 4 + length);
        connection.buffer = connection.buffer.slice(4 + length);
      } else {
        this.logger.debug(`No length prefix detected, treating entire buffer as message (raw protobuf)`);
        messageData = connection.buffer;
        connection.buffer = Buffer.alloc(0);
      }

      try {
        this.processMessage(connection, messageData);
      } catch (err) {
        this.logger.error(`Error processing message: ${err.message}`);
        this.logger.error(`Stack trace: ${(err as Error).stack}`);
        this.sendError(connection, 1001, err.message);
      }
    }
  }

  private processMessage(connection: PluginConnection, data: Buffer) {
    this.logger.debug(`Processing message: ${data.length} bytes, authenticated: ${connection.isAuthenticated}`);
    
    let payload: Buffer;

    if (connection.isAuthenticated && connection.aesCipher) {
      this.logger.debug('Decrypting message with AES');
      payload = CryptoUtil.decryptWithAES(
        connection.aesCipher.key,
        connection.aesCipher.iv,
        data,
      );
      this.logger.debug(`Decrypted payload: ${payload.length} bytes`);
    } else {
      this.logger.debug('Message is not encrypted (handshake phase)');
      payload = data;
    }

    try {
      const message = this.protoService.decodeMessage(payload);
      this.logger.debug(`Decoded message type: ${message.type}, payload length: ${message.payload?.length || 0}`);

      switch (message.type) {
        case 'HANDSHAKE_REQUEST':
          this.handleHandshake(connection, message);
          break;
        case 'PLUGIN_REQUEST':
          this.handlePluginRequest(connection, message);
          break;
        case 'HEARTBEAT':
          this.handleHeartbeat(connection, message);
          break;
        default:
          this.logger.warn(`Unknown message type: ${message.type}`);
          this.sendError(connection, 1003, `Unknown message type: ${message.type}`);
      }
    } catch (decodeErr) {
      this.logger.error(`Failed to decode message: ${(decodeErr as Error).message}`);
      this.logger.error(`Payload hex: ${payload.slice(0, 64).toString('hex')}...`);
      this.sendError(connection, 1002, `Failed to decode message: ${(decodeErr as Error).message}`);
    }
  }

  private handleHandshake(connection: PluginConnection, message: any) {
    this.logger.log(`Handling handshake from ${connection.remoteAddress}`);

    try {
      const handshakeRequest = this.protoService.decodeHandshakeRequest(
        Buffer.isBuffer(message.payload) ? message.payload : Buffer.from(message.payload),
      );

      this.logger.log(`Handshake request: pluginId=${handshakeRequest.pluginId}, pluginName=${handshakeRequest.pluginName}`);

      if (!handshakeRequest.pluginId || !handshakeRequest.botToken) {
        this.sendHandshakeResponse(connection, false, '插件ID或Bot Token不能为空');
        return;
      }

      const aesKey = CryptoUtil.decryptWithRSA(
        this.rsaKeyPair.privateKey,
        Buffer.isBuffer(handshakeRequest.rsaEncryptedAesKey)
          ? handshakeRequest.rsaEncryptedAesKey
          : Buffer.from(handshakeRequest.rsaEncryptedAesKey),
      );

      const aesIv = Buffer.from(handshakeRequest.aesIv, 'base64');

      connection.pluginId = handshakeRequest.pluginId;
      connection.pluginName = handshakeRequest.pluginName;
      connection.pluginVersion = handshakeRequest.pluginVersion;
      connection.botToken = handshakeRequest.botToken;
      connection.aesCipher = { key: aesKey, iv: aesIv };
      connection.isAuthenticated = true;
      connection.subscribedEvents = handshakeRequest.subscribedEvents || [];
      connection.lastHeartbeatAt = Date.now();

      const botId = this.extractBotIdFromToken(handshakeRequest.botToken);
      if (botId) {
        if (!this.botPluginMap.has(botId)) {
          this.botPluginMap.set(botId, []);
        }
        const plugins = this.botPluginMap.get(botId);
        if (!plugins.includes(connection.sessionId)) {
          plugins.push(connection.sessionId);
        }
      }

      this.logger.log(`Plugin authenticated: ${handshakeRequest.pluginId} (${handshakeRequest.pluginName})`);

      this.sendHandshakeResponse(connection, true, '握手成功');

      this.eventEmitter.emit('plugin.authenticated', {
        sessionId: connection.sessionId,
        pluginId: connection.pluginId,
        pluginName: connection.pluginName,
        botToken: connection.botToken,
        subscribedEvents: connection.subscribedEvents,
      });
    } catch (err) {
      this.logger.error(`Handshake failed: ${err.message}`);
      this.sendHandshakeResponse(connection, false, `握手失败: ${err.message}`);
    }
  }

  private sendHandshakeResponse(connection: PluginConnection, success: boolean, message: string) {
    const responsePayload = this.protoService.encodeHandshakeResponse({
      success,
      message,
      serverVersion: '1.0.0',
      serverTime: Date.now(),
      sessionId: connection.sessionId,
    });

    const messageWrapper = this.protoService.encodeMessage({
      type: 'HANDSHAKE_RESPONSE',
      payload: responsePayload,
      timestamp: Date.now(),
      requestId: '',
    });

    this.sendRawMessage(connection, messageWrapper);
  }

  private handlePluginRequest(connection: PluginConnection, message: any) {
    if (!connection.isAuthenticated) {
      this.sendError(connection, 1002, '未认证');
      return;
    }

    const pluginRequest = this.protoService.decodePluginRequest(
      Buffer.isBuffer(message.payload) ? message.payload : Buffer.from(message.payload),
    );

    this.logger.debug(`Plugin request: ${pluginRequest.apiName}, requestId: ${message.requestId}`);

    this.eventEmitter.emit('plugin.request', {
      sessionId: connection.sessionId,
      pluginId: connection.pluginId,
      botToken: connection.botToken,
      requestId: message.requestId,
      apiName: pluginRequest.apiName,
      metadata: pluginRequest.metadata,
      parameters: pluginRequest.parameters,
    });
  }

  private handleHeartbeat(connection: PluginConnection, message: any) {
    if (!connection.isAuthenticated) {
      return;
    }

    const heartbeat = this.protoService.decodeMessage(
      Buffer.isBuffer(message.payload) ? message.payload : Buffer.from(message.payload),
    );

    connection.lastHeartbeatAt = Date.now();
    connection.heartbeatSeq = heartbeat.seq || 0;

    const ackPayload = this.protoService.encodeHeartbeatAck({
      timestamp: Date.now(),
      seq: connection.heartbeatSeq,
      serverTime: Date.now(),
    });

    const ackMessage = this.protoService.encodeMessage({
      type: 'HEARTBEAT_ACK',
      payload: ackPayload,
      timestamp: Date.now(),
      requestId: '',
    });

    this.sendMessage(connection, ackMessage);
  }

  sendPluginResponse(connection: PluginConnection, requestId: string, success: boolean, code: number, message: string, data: Buffer) {
    const responsePayload = this.protoService.encodePluginResponse({
      success,
      code,
      message,
      data,
      requestId,
    });

    const messageWrapper = this.protoService.encodeMessage({
      type: 'PLUGIN_RESPONSE',
      payload: responsePayload,
      timestamp: Date.now(),
      requestId,
    });

    this.sendMessage(connection, messageWrapper);
  }

  pushEvent(botId: string, eventType: string, eventId: string, eventTime: number, payload: Buffer) {
    const pluginSessionIds = this.botPluginMap.get(botId) || [];

    for (const sessionId of pluginSessionIds) {
      const connection = this.connections.get(sessionId);
      if (!connection || !connection.isAuthenticated) continue;

      if (connection.subscribedEvents.length > 0 && !connection.subscribedEvents.includes(eventType)) {
        continue;
      }

      const eventPayload = this.protoService.encodeEventPush({
        eventType,
        eventId,
        eventTime,
        botId,
        payload,
      });

      const message = this.protoService.encodeMessage({
        type: 'EVENT_PUSH',
        payload: eventPayload,
        timestamp: Date.now(),
        requestId: eventId,
      });

      this.sendMessage(connection, message);
    }
  }

  private sendMessage(connection: PluginConnection, message: Buffer) {
    if (connection.isAuthenticated && connection.aesCipher) {
      const encrypted = CryptoUtil.encryptWithAES(
        connection.aesCipher.key,
        connection.aesCipher.iv,
        message,
      );
      this.sendRawMessage(connection, encrypted);
    } else {
      this.sendRawMessage(connection, message);
    }
  }

  private sendRawMessage(connection: PluginConnection, data: Buffer) {
    if (connection.socket.destroyed) return;

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    connection.socket.write(Buffer.concat([lengthBuffer, data]));
  }

  private sendError(connection: PluginConnection, code: number, message: string) {
    const errorPayload = this.protoService.encodeErrorMessage({
      code,
      message,
      details: '',
    });

    const messageWrapper = this.protoService.encodeMessage({
      type: 'ERROR',
      payload: errorPayload,
      timestamp: Date.now(),
      requestId: '',
    });

    this.sendMessage(connection, messageWrapper);
  }

  private handleDisconnect(connection: PluginConnection) {
    this.logger.log(`Plugin disconnected: ${connection.pluginId || 'unknown'} (session: ${connection.sessionId})`);
  }

  private handleSocketError(connection: PluginConnection, err: Error) {
    this.logger.error(`Socket error for ${connection.pluginId || 'unknown'}: ${err.message}`);
  }

  private handleSocketClose(connection: PluginConnection) {
    this.logger.log(`Socket closed: ${connection.pluginId || 'unknown'} (session: ${connection.sessionId})`);

    this.connections.delete(connection.sessionId);

    const botId = this.extractBotIdFromToken(connection.botToken);
    if (botId && this.botPluginMap.has(botId)) {
      const plugins = this.botPluginMap.get(botId);
      const index = plugins.indexOf(connection.sessionId);
      if (index > -1) {
        plugins.splice(index, 1);
      }
      if (plugins.length === 0) {
        this.botPluginMap.delete(botId);
      }
    }

    this.eventEmitter.emit('plugin.disconnected', {
      sessionId: connection.sessionId,
      pluginId: connection.pluginId,
      pluginName: connection.pluginName,
    });
  }

  private extractBotIdFromToken(token: string): string {
    if (!token) return '';
    return CryptoUtil.md5(token).substring(0, 16);
  }

  getConnection(sessionId: string): PluginConnection | undefined {
    return this.connections.get(sessionId);
  }

  getAllConnections(): PluginConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getBotPluginCount(botId: string): number {
    return this.botPluginMap.get(botId)?.length || 0;
  }

  getRSAPublicKey(): string {
    return this.rsaKeyPair.publicKey;
  }

  getConnectionByPluginId(pluginId: string): PluginConnection | undefined {
    for (const conn of this.connections.values()) {
      if (conn.pluginId === pluginId && conn.isAuthenticated) {
        return conn;
      }
    }
    return undefined;
  }
}
