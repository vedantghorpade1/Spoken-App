import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const scale = useSharedValue(0.86);
  const opacity = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.exp) });
    opacity.value = withTiming(1, { duration: 900 });
    float.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [float, opacity, scale]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: -10 * float.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: 12 - 12 * opacity.value }],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Svg width={196} height={196} style={styles.orbits}>
          <Circle cx={98} cy={98} r={86} stroke="rgba(16,185,129,0.18)" strokeWidth={1.5} fill="none" />
          <Circle cx={98} cy={98} r={60} stroke="rgba(124,92,255,0.16)" strokeWidth={1.5} fill="none" />
        </Svg>
        <LinearGradient colors={['#10B981', '#4D7CFE', '#8C5CFF']} style={styles.orb}>
          <MaterialCommunityIcons name="microphone-variant" size={52} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.copy, copyStyle]}>
        <Text style={styles.brand}>SpeakAI</Text>
        <Text style={styles.tagline}>Speak Freely</Text>
        <Text style={styles.caption}>AI-powered spoken English practice for global conversations.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 28,
  },
  glowOne: {
    position: 'absolute',
    top: -90,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16,185,129,0.16)',
  },
  glowTwo: {
    position: 'absolute',
    bottom: 72,
    left: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124,92,255,0.12)',
  },
  logoWrap: {
    width: 196,
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbits: {
    position: 'absolute',
  },
  orb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.emerald,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
  },
  copy: {
    marginTop: 28,
    alignItems: 'center',
  },
  brand: {
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tagline: {
    marginTop: 8,
    color: palette.emeraldDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  caption: {
    marginTop: 12,
    maxWidth: 290,
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
});
