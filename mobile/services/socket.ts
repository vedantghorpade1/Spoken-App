import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/constants/api';
import { normalizeCall } from '@/services/voice-api';
import type { CallRoom } from '@/types/voice';

type VoiceSocketEvents = {
  onMatchmakingFound?: (call: CallRoom) => void;
  onIncomingCall?: (call: CallRoom) => void;
  onCallAccepted?: (call: CallRoom) => void;
  onCallRejected?: (call: CallRoom) => void;
  onCallEnded?: (call: CallRoom & { duration?: number }) => void;
  onUserLeft?: (userId: string) => void;
  onReconnect?: () => void;
};

class VoiceSocketService {
  private socket: Socket | null = null;

  connect(token: string, events: VoiceSocketEvents) {
    this.disconnect();

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    socket.on('connect', () => events.onReconnect?.());
    socket.on('reconnect', () => events.onReconnect?.());
    socket.on('matchmaking_found', (payload) => events.onMatchmakingFound?.(normalizeCall(payload)));
    socket.on('incoming_call', (payload) => events.onIncomingCall?.(normalizeCall(payload)));
    socket.on('call_accepted', (payload) => events.onCallAccepted?.(normalizeCall(payload)));
    socket.on('call_rejected', (payload) => events.onCallRejected?.(normalizeCall(payload)));
    socket.on('call_ended', (payload) => events.onCallEnded?.({ ...normalizeCall(payload), duration: payload.duration }));
    socket.on('user_left', (payload) => events.onUserLeft?.(payload.user_id));

    this.socket = socket;
  }

  acceptCall(callId: string) {
    this.socket?.emit('call_accepted', { call_id: callId });
  }

  rejectCall(callId: string) {
    this.socket?.emit('call_rejected', { call_id: callId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const voiceSocketService = new VoiceSocketService();
