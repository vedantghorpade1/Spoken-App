import { api } from '@/services/api';

export type PredefinedRoom = {
  id: string;
  name: string;
  description: string;
  channel: string;
  category: string;
  icon: string;
  participants: number;
  isLive: boolean;
};

export type RoomParticipant = {
  id: string;
  uid: number;
  name: string;
  initials: string;
  muted: boolean;
  speaking: boolean;
};

export type JoinRoomResponse = {
  token?: string | null;
  channelName: string;
  appId?: string | null;
  uid: number;
  room: PredefinedRoom;
  participants: RoomParticipant[];
};

async function withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  throw lastError;
}

export const roomApi = {
  async list() {
    const { data } = await api.get<PredefinedRoom[]>('/rooms');
    return data;
  },
  async join(roomId: string, userId: string) {
    return withRetry(async () => {
      const { data } = await api.post<JoinRoomResponse>('/rooms/join', { roomId, userId });
      return data;
    }, 3);
  },
  async leave(roomId: string, duration = 0) {
    await api.post('/rooms/leave', { roomId, duration });
  },
};
