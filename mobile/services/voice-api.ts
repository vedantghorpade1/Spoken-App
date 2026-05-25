import { api } from '@/services/api';
import type { CallHistoryItem, CallPartner, CallRoom, MatchmakingResult, ProgressSummary } from '@/types/voice';

type ApiCallRoom = {
  call_id: string;
  channel_name: string;
  agora_token?: string | null;
  uid: number;
  partner: CallPartner;
  call_type: string;
  status: string;
};

type ApiMatchmakingResult = {
  status: string;
  call?: ApiCallRoom | null;
};

export function normalizeCall(data: ApiCallRoom): CallRoom {
  return {
    callId: data.call_id,
    channelName: data.channel_name,
    agoraToken: data.agora_token ?? null,
    uid: data.uid,
    partner: data.partner,
    callType: data.call_type,
    status: data.status,
  };
}

function normalizeMatch(data: ApiMatchmakingResult): MatchmakingResult {
  return {
    status: data.status,
    call: data.call ? normalizeCall(data.call) : null,
  };
}

export const voiceApi = {
  async joinMatchmaking() {
    const { data } = await api.post<ApiMatchmakingResult>('/matchmaking/join');
    return normalizeMatch(data);
  },
  async matchmakingStatus() {
    const { data } = await api.get<ApiMatchmakingResult>('/matchmaking/status');
    return normalizeMatch(data);
  },
  async createCall(receiverId: string) {
    const { data } = await api.post<ApiCallRoom>('/call/create', { receiver_id: receiverId, call_type: 'friend' });
    return normalizeCall(data);
  },
  async endCall(callId: string, duration: number) {
    await api.post('/call/end', { call_id: callId, duration });
  },
  async agoraToken(channelName: string, uid: number) {
    const { data } = await api.post<{ agora_token?: string | null; uid: number; channel_name: string }>('/agora/token', {
      channel_name: channelName,
      uid,
    });
    return data.agora_token ?? null;
  },
  async onlineFriends() {
    const { data } = await api.get<CallPartner[]>('/friends/online');
    return data;
  },
  async callHistory() {
    const { data } = await api.get<CallHistoryItem[]>('/call/history');
    return data;
  },
  async progress() {
    const { data } = await api.get<ProgressSummary>('/progress');
    return data;
  },
};
