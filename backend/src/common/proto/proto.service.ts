import * as protobuf from 'protobufjs';
import { join } from 'path';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class ProtoService implements OnModuleInit {
  private readonly logger = new Logger(ProtoService.name);
  private root: protobuf.Root;
  private messageType: protobuf.Type;
  private handshakeRequestType: protobuf.Type;
  private handshakeResponseType: protobuf.Type;
  private pluginRequestType: protobuf.Type;
  private pluginResponseType: protobuf.Type;
  private eventPushType: protobuf.Type;
  private heartbeatType: protobuf.Type;
  private heartbeatAckType: protobuf.Type;
  private errorMessageType: protobuf.Type;

  async onModuleInit() {
    await this.loadProtos();
  }

  private async loadProtos() {
    const protoDir = join(process.cwd(), '..', 'proto');
    
    this.root = await protobuf.load([
      join(protoDir, 'common.proto'),
      join(protoDir, 'api.proto'),
      join(protoDir, 'events.proto'),
    ]);

    this.messageType = this.root.lookupType('yunhu.plugin.Message');
    this.handshakeRequestType = this.root.lookupType('yunhu.plugin.HandshakeRequest');
    this.handshakeResponseType = this.root.lookupType('yunhu.plugin.HandshakeResponse');
    this.pluginRequestType = this.root.lookupType('yunhu.plugin.PluginRequest');
    this.pluginResponseType = this.root.lookupType('yunhu.plugin.PluginResponse');
    this.eventPushType = this.root.lookupType('yunhu.plugin.EventPush');
    this.heartbeatType = this.root.lookupType('yunhu.plugin.Heartbeat');
    this.heartbeatAckType = this.root.lookupType('yunhu.plugin.HeartbeatAck');
    this.errorMessageType = this.root.lookupType('yunhu.plugin.ErrorMessage');

    this.logger.log('Proto files loaded successfully');
  }

  getRoot(): protobuf.Root {
    return this.root;
  }

  lookupType(name: string): protobuf.Type {
    return this.root.lookupType(name);
  }

  encodeMessage(payload: any): Buffer {
    const typeMap: Record<string, number> = {
      UNKNOWN: 0,
      HANDSHAKE_REQUEST: 1,
      HANDSHAKE_RESPONSE: 2,
      PLUGIN_REQUEST: 3,
      PLUGIN_RESPONSE: 4,
      EVENT_PUSH: 5,
      HEARTBEAT: 6,
      HEARTBEAT_ACK: 7,
      ERROR: 8,
    };
    
    const normalized = { ...payload };
    if (typeof normalized.type === 'string' && typeMap[normalized.type] !== undefined) {
      normalized.type = typeMap[normalized.type];
    }
    
    const errMsg = this.messageType.verify(normalized);
    if (errMsg) throw new Error(errMsg);
    const message = this.messageType.create(normalized);
    const buffer = this.messageType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeMessage(buffer: Buffer): any {
    const message = this.messageType.decode(new Uint8Array(buffer));
    return this.messageType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodeHandshakeRequest(payload: any): Buffer {
    const errMsg = this.handshakeRequestType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.handshakeRequestType.create(payload);
    const buffer = this.handshakeRequestType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeHandshakeRequest(buffer: Buffer): any {
    const message = this.handshakeRequestType.decode(new Uint8Array(buffer));
    return this.handshakeRequestType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodeHandshakeResponse(payload: any): Buffer {
    const errMsg = this.handshakeResponseType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.handshakeResponseType.create(payload);
    const buffer = this.handshakeResponseType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeHandshakeResponse(buffer: Buffer): any {
    const message = this.handshakeResponseType.decode(new Uint8Array(buffer));
    return this.handshakeResponseType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodePluginRequest(payload: any): Buffer {
    const errMsg = this.pluginRequestType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.pluginRequestType.create(payload);
    const buffer = this.pluginRequestType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodePluginRequest(buffer: Buffer): any {
    const message = this.pluginRequestType.decode(new Uint8Array(buffer));
    return this.pluginRequestType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodePluginResponse(payload: any): Buffer {
    const errMsg = this.pluginResponseType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.pluginResponseType.create(payload);
    const buffer = this.pluginResponseType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodePluginResponse(buffer: Buffer): any {
    const message = this.pluginResponseType.decode(new Uint8Array(buffer));
    return this.pluginResponseType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodeEventPush(payload: any): Buffer {
    const errMsg = this.eventPushType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.eventPushType.create(payload);
    const buffer = this.eventPushType.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeEventPush(buffer: Buffer): any {
    const message = this.eventPushType.decode(new Uint8Array(buffer));
    return this.eventPushType.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodeHeartbeat(payload: any): Buffer {
    const errMsg = this.heartbeatType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.heartbeatType.create(payload);
    const buffer = this.heartbeatType.encode(message).finish();
    return Buffer.from(buffer);
  }

  encodeHeartbeatAck(payload: any): Buffer {
    const errMsg = this.heartbeatAckType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.heartbeatAckType.create(payload);
    const buffer = this.heartbeatAckType.encode(message).finish();
    return Buffer.from(buffer);
  }

  encodeErrorMessage(payload: any): Buffer {
    const errMsg = this.errorMessageType.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = this.errorMessageType.create(payload);
    const buffer = this.errorMessageType.encode(message).finish();
    return Buffer.from(buffer);
  }

  encodeApiMessage(typeName: string, payload: any): Buffer {
    const type = this.root.lookupType(`yunhu.plugin.api.${typeName}`);
    if (!type) throw new Error(`Unknown API type: ${typeName}`);
    const errMsg = type.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = type.create(payload);
    const buffer = type.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeApiMessage(typeName: string, buffer: Buffer): any {
    const type = this.root.lookupType(`yunhu.plugin.api.${typeName}`);
    if (!type) throw new Error(`Unknown API type: ${typeName}`);
    const message = type.decode(new Uint8Array(buffer));
    return type.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }

  encodeEventMessage(typeName: string, payload: any): Buffer {
    const type = this.root.lookupType(`yunhu.plugin.event.${typeName}`);
    if (!type) throw new Error(`Unknown event type: ${typeName}`);
    const errMsg = type.verify(payload);
    if (errMsg) throw new Error(errMsg);
    const message = type.create(payload);
    const buffer = type.encode(message).finish();
    return Buffer.from(buffer);
  }

  decodeEventMessage(typeName: string, buffer: Buffer): any {
    const type = this.root.lookupType(`yunhu.plugin.event.${typeName}`);
    if (!type) throw new Error(`Unknown event type: ${typeName}`);
    const message = type.decode(new Uint8Array(buffer));
    return type.toObject(message, {
      longs: String,
      enums: String,
      bytes: Buffer,
    });
  }
}
