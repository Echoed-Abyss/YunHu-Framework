import { Socket } from 'net';
import { AESCipher } from '../../common/utils/crypto.util';

export interface PluginConnection {
  socket: Socket;
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  botToken: string;
  sessionId: string;
  isAuthenticated: boolean;
  aesCipher: AESCipher | null;
  subscribedEvents: string[];
  connectedAt: number;
  lastHeartbeatAt: number;
  heartbeatSeq: number;
  remoteAddress: string;
  remotePort: number;
  buffer: Buffer;
}

export const MessageType = {
  UNKNOWN: 0,
  HANDSHAKE_REQUEST: 1,
  HANDSHAKE_RESPONSE: 2,
  PLUGIN_REQUEST: 3,
  PLUGIN_RESPONSE: 4,
  EVENT_PUSH: 5,
  HEARTBEAT: 6,
  HEARTBEAT_ACK: 7,
  ERROR: 8,
} as const;

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType];
