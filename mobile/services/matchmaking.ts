import { voiceApi } from '@/services/voice-api';
import { api } from '@/services/api';

export const joinMatchmaking = voiceApi.joinMatchmaking;
export const getMatchmakingStatus = voiceApi.matchmakingStatus;

export async function leaveMatchmakingQueue() {
  await api.post('/matchmaking/leave');
}
