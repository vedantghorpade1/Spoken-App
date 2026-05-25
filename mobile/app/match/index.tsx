import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, PhoneCall, ShieldCheck, Sparkles, UsersRound } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceWave } from '@/components/VoiceWave';
import { GlassCard, Screen, palette } from '@/components/premium-ui';

export default function MatchIndexScreen() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.86 - pulse.value * 0.12,
  }));

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Random voice matching</Text>
            <Text style={styles.title}>Find a speaking partner</Text>
            <Text style={styles.subtitle}>Instant English practice with a live voice room, clear controls, and fast rematch.</Text>
          </View>

          <View style={styles.stage}>
            <Animated.View style={[styles.glow, orbStyle]} />
            <LinearGradient colors={['#07956A', '#4D7CFE', '#8C5CFF']} style={styles.orb}>
              <Mic size={44} color={palette.surface} />
            </LinearGradient>
            <View style={styles.waveWrap}>
              <VoiceWave active color={palette.emeraldDeep} />
            </View>
          </View>

          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <UsersRound size={20} color={palette.emeraldDeep} />
              <Text style={styles.infoText}>18,420 learners online</Text>
            </View>
            <View style={styles.infoRow}>
              <ShieldCheck size={20} color={palette.blue} />
              <Text style={styles.infoText}>Audio-only private Agora room</Text>
            </View>
            <View style={styles.infoRow}>
              <Sparkles size={20} color={palette.purple} />
              <Text style={styles.infoText}>AI compatibility score preview</Text>
            </View>
          </GlassCard>

          <Pressable onPress={() => router.push('/match/searching')} style={styles.startPressable}>
            <LinearGradient colors={['#07956A', '#4D7CFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startButton}>
              <PhoneCall size={21} color={palette.surface} />
              <Text style={styles.startText}>Start Matching</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 22, paddingBottom: 34 },
  header: { paddingTop: 6 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  title: { marginTop: 8, color: palette.text, fontSize: 36, lineHeight: 40, fontWeight: '900' },
  subtitle: { marginTop: 10, color: palette.muted, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  stage: { height: 340, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(7,149,106,0.14)',
  },
  orb: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.emerald,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.32,
    shadowRadius: 32,
    elevation: 12,
  },
  waveWrap: { position: 'absolute', bottom: 24 },
  infoCard: { gap: 14 },
  infoRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '800' },
  startPressable: { marginTop: 'auto' },
  startButton: {
    minHeight: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  startText: { color: palette.surface, fontSize: 16, fontWeight: '900' },
});
