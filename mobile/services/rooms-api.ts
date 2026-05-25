import { api } from '@/services/api';
import type { CreateRoomPayload, LiveRoom, RoomAnalytics } from '@/types/rooms';

type ApiRoomParticipant = {
  id: string;
  name: string;
  initials?: string;
  role: LiveRoom['host']['role'];
  level?: string;
  muted?: boolean;
  speaking?: boolean;
  raised_hand?: boolean;
};

type ApiLiveRoom = {
  id: string;
  title: string;
  topic: string;
  description?: string;
  category: LiveRoom['category'];
  level: string;
  type: LiveRoom['type'];
  host: ApiRoomParticipant;
  participants: ApiRoomParticipant[];
  speakers: number;
  listeners: number;
  tags?: string[];
  is_live: boolean;
  is_followed?: boolean;
  channel_name: string;
  agora_token?: string | null;
  uid?: number;
  started_at: string;
};

function normalizeParticipant(participant: ApiRoomParticipant) {
  return {
    id: participant.id,
    name: participant.name,
    initials: participant.initials ?? participant.name.slice(0, 2).toUpperCase(),
    role: participant.role,
    level: participant.level ?? 'B2',
    muted: Boolean(participant.muted),
    speaking: Boolean(participant.speaking),
    raisedHand: Boolean(participant.raised_hand),
  };
}

export function normalizeRoom(room: ApiLiveRoom): LiveRoom {
  return {
    id: room.id,
    title: room.title,
    topic: room.topic,
    description: room.description ?? '',
    category: room.category,
    level: room.level,
    type: room.type,
    host: normalizeParticipant(room.host),
    participants: room.participants.map(normalizeParticipant),
    speakers: room.speakers,
    listeners: room.listeners,
    tags: room.tags ?? [],
    isLive: room.is_live,
    isFollowed: room.is_followed,
    channelName: room.channel_name,
    agoraToken: room.agora_token,
    uid: room.uid,
    startedAt: room.started_at,
  };
}

export const roomsApi = {
  async live(category?: string) {
    const { data } = await api.get<ApiLiveRoom[]>('/rooms/live', { params: category && category !== 'All' ? { category } : undefined });
    return data.map(normalizeRoom);
  },
  async trending() {
    const { data } = await api.get<ApiLiveRoom[]>('/rooms/trending');
    return data.map(normalizeRoom);
  },
  async create(payload: CreateRoomPayload) {
    const { data } = await api.post<ApiLiveRoom>('/rooms/create', payload);
    return normalizeRoom(data);
  },
  async join(roomId: string) {
    const { data } = await api.post<ApiLiveRoom>('/rooms/join', { room_id: roomId });
    return normalizeRoom(data);
  },
  async leave(roomId: string, duration = 0) {
    await api.post('/rooms/leave', { room_id: roomId, duration });
  },
  async end(roomId: string) {
    await api.post('/rooms/end', { room_id: roomId });
  },
  async raiseHand(roomId: string) {
    await api.post('/rooms/raise-hand', { room_id: roomId });
  },
  async approveSpeaker(roomId: string, userId: string) {
    await api.post('/rooms/approve-speaker', { room_id: roomId, user_id: userId });
  },
  async invite(roomId: string, userId: string) {
    await api.post('/rooms/invite', { room_id: roomId, user_id: userId });
  },
  async agoraToken(channelName: string, uid: number) {
    const { data } = await api.post<{ agora_token?: string | null; uid: number; channel_name: string }>('/agora/token', {
      channel_name: channelName,
      uid,
    });
    return data;
  },
  async analytics() {
    const { data } = await api.get<RoomAnalytics>('/rooms/analytics');
    return data;
  },
};
