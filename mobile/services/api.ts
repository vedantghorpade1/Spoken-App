import axios from 'axios';

import { API_BASE_URL } from '@/constants/api';

export const TOKEN_KEY = 'speakai.token';
export const USER_KEY = 'speakai.user';

export type AuthCredentials = {
  name?: string;
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

type ApiError = {
  detail?: string;
  message?: string;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function normalizeError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as ApiError | undefined;
    if (error.code === 'ECONNABORTED') {
      return new Error('Connection timed out. Check that FastAPI is running on 0.0.0.0 and your phone is on the same WiFi.');
    }

    if (!error.response) {
      return new Error('Cannot connect to server. Use your computer IPv4 address, not localhost, and run uvicorn with --host 0.0.0.0.');
    }

    return new Error(response?.detail || response?.message || error.message || 'Request failed');
  }
  return error instanceof Error ? error : new Error('Unexpected error');
}

async function authPost<T extends AuthResult>(path: string, credentials: AuthCredentials): Promise<T> {
  try {
    const { data } = await api.post<T>(path, credentials);
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export const authApi = {
  login(credentials: AuthCredentials) {
    return authPost<AuthResult>('/login', credentials);
  },
  signup(credentials: AuthCredentials) {
    return authPost<AuthResult>('/signup', credentials);
  },
  async profile() {
    try {
      const { data } = await api.get<AuthUser>('/profile');
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
