import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi, AuthCredentials, AuthUser, clearStoredAuth, onUnauthorized, setApiToken, TOKEN_KEY, USER_KEY } from '@/services/api';

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
    return onUnauthorized(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

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
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
            }
          } catch {
            setApiToken(null);
            setToken(null);
            setUser(null);
            await clearStoredAuth();
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
      AsyncStorage.setItem(TOKEN_KEY, nextToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
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
    await clearStoredAuth();
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
