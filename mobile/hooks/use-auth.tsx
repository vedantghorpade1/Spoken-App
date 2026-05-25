import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, AuthCredentials, AuthUser, setApiToken, TOKEN_KEY, USER_KEY } from '@/services/api';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

        if (!mounted) {
          return;
        }

        if (storedToken) {
          setApiToken(storedToken);
          setToken(storedToken);
          try {
            const profile = await authApi.profile();
            if (mounted) {
              setUser(profile);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(profile));
            }
          } catch {
            setApiToken(null);
            setToken(null);
            setUser(null);
            await Promise.all([
              SecureStore.deleteItemAsync(TOKEN_KEY),
              SecureStore.deleteItemAsync(USER_KEY),
            ]);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const persistSession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    setApiToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, nextToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      const result = await authApi.login(credentials);
      await persistSession(result.token, result.user);
    },
    [persistSession],
  );

  const signup = useCallback(
    async (credentials: AuthCredentials) => {
      const result = await authApi.signup(credentials);
      await persistSession(result.token, result.user);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    setApiToken(null);
    setToken(null);
    setUser(null);
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(token),
      token,
      user,
      login,
      signup,
      logout,
    }),
    [isLoading, login, logout, signup, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
