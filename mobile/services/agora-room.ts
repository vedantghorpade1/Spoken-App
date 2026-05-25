import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/constants/api';
import { agoraVoiceService, type AgoraCallState, type AgoraVoiceEvent } from '@/services/agora';
import type { RoomParticipant } from '@/services/room-api';

type RoomSocketEvents = {
  onParticipantJoined?: (participants: RoomParticipant[]) => void;
  onParticipantLeft?: (participants: RoomParticipant[]) => void;
  onActiveSpeaker?: (userId: string | null, participants: RoomParticipant[]) => void;
  onMuteChanged?: (participants: RoomParticipant[]) => void;
  onReconnect?: () => void;
};

class AgoraRoomService {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  subscribeAgora(listener: (event: AgoraVoiceEvent) => void) {
    return agoraVoiceService.subscribe(listener);
  }

  async joinVoice(channelName: string, token: string | null | undefined, uid: number) {
    await agoraVoiceService.joinChannel(channelName, token ?? '', uid);
  }

  connectSocket(token: string, roomId: string, events: RoomSocketEvents) {
    this.disconnectSocket();
    this.roomId = roomId;

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    const participantsFrom = (payload: { participants?: RoomParticipant[] }) => payload.participants ?? [];

    socket.on('connect', () => {
      socket.emit('room_joined', { roomId });
      events.onReconnect?.();
    });
    socket.on('reconnect', () => {
      socket.emit('room_joined', { roomId });
      events.onReconnect?.();
    });
    socket.on('participant_joined', (payload) => events.onParticipantJoined?.(participantsFrom(payload)));
    socket.on('participant_left', (payload) => events.onParticipantLeft?.(participantsFrom(payload)));
    socket.on('active_speaker', (payload) => events.onActiveSpeaker?.(payload.userId ?? null, participantsFrom(payload)));
    socket.on('room_mute_changed', (payload) => events.onMuteChanged?.(participantsFrom(payload)));

    this.socket = socket;
  }

  emitSpeaking(speaking: boolean) {
    if (this.roomId) {
      this.socket?.emit('room_speaking_changed', { roomId: this.roomId, speaking });
    }
  }

  emitMuted(muted: boolean) {
    if (this.roomId) {
      this.socket?.emit('room_mute_changed', { roomId: this.roomId, muted });
    }
  }

  muteLocalAudio(muted: boolean) {
    agoraVoiceService.muteLocalAudio(muted);
    this.emitMuted(muted);
  }

  setSpeaker(enabled: boolean) {
    agoraVoiceService.setSpeaker(enabled);
  }

  async leaveVoice() {
    await agoraVoiceService.leaveChannel();
  }

  disconnectSocket() {
    if (this.socket) {
      if (this.roomId) {
        this.socket.emit('room_left', { roomId: this.roomId });
      }
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.roomId = null;
  }

  async leaveAll() {
    this.disconnectSocket();
    await this.leaveVoice();
  }
}

export type { AgoraCallState, RoomSocketEvents };
export const agoraRoomService = new AgoraRoomService();
