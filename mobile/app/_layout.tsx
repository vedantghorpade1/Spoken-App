import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { VoiceCallsProvider } from '@/hooks/use-voice-calls';

function ProtectedRoutes({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    if (!isAuthenticated && rootSegment !== '(auth)') {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return children;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <VoiceCallsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ProtectedRoutes>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="match" />
                <Stack.Screen name="rooms" />
                <Stack.Screen name="friends" />
                <Stack.Screen name="calls" />
                <Stack.Screen name="progress" />
              </Stack>
            </ProtectedRoutes>
          </GestureHandlerRootView>
          <StatusBar style="dark" />
        </ThemeProvider>
      </VoiceCallsProvider>
    </AuthProvider>
  );
}
