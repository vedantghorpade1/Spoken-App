import { API_BASE_URL } from '@/constants/api';

export const env = {
  apiBaseUrl: API_BASE_URL,
  agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '',
};

export function requireEnv(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`${name} is missing. Add it to mobile/.env and rebuild the Expo development client.`);
  }

  return value;
}
