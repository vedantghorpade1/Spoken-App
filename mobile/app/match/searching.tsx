import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, PhoneOff, Radar, Sparkles, UsersRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useVoiceCalls } from '@/hooks/use-voice-calls';
import { getMatchmakingStatus, joinMatchmaking, leaveMatchmakingQueue } from '@/services/matchmaking';

export default function SearchingScreen() {
  const [dots, setDots] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(18420);
  const { openCall } = useVoiceCalls();
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);
  const float = useSharedValue(0);

  const candidates = useMemo(
    () => [
      { name: 'Maya', score: '96%' },
      { name: 'Leo', score: '92%' },
      { name: 'Ava', score: '89%' },
    ],
    [],
  );

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
    float.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [float, pulse, rotate]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((value) => (value.length >= 3 ? '' : `${value}.`));
    }, 420);
    const onlineTimer = setInterval(() => {
      setOnlineUsers((value) => value + Math.floor(Math.random() * 9) - 3);
    }, 900);

    return () => {
      clearInterval(dotTimer);
      clearInterval(onlineTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    async function findPartner() {
      try {
        const result = await joinMatchmaking();
        if (!cancelled && result.call) {
          openCall(result.call);
          return;
        }

        fallbackTimer = setInterval(async () => {
          const status = await getMatchmakingStatus();
          if (!cancelled && status.call) {
            if (fallbackTimer) {
              clearInterval(fallbackTimer);
              fallbackTimer = null;
            }
            openCall(status.call);
          }
        }, 2500);
        timeoutTimer = setTimeout(async () => {
          if (!cancelled) {
            cancelled = true;
            if (fallbackTimer) {
              clearInterval(fallbackTimer);
              fallbackTimer = null;
            }
            await leaveMatchmakingQueue().catch(() => undefined);
            setError('No partner found yet. Try again in a moment.');
          }
        }, 45000);
      } catch (matchError) {
        if (!cancelled) {
          setError(matchError instanceof Error ? matchError.message : 'Unable to find a partner.');
        }
      }
    }

    findPartner();

    return () => {
      cancelled = true;
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      leaveMatchmakingQueue().catch(() => undefined);
    };
  }, [openCall]);

  const handleCancel = useCallback(async () => {
    await leaveMatchmakingQueue().catch(() => undefined);
    router.replace('/match');
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * float.value }, { scale: 1 + pulse.value * 0.05 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.16 }],
    opacity: 0.42 - pulse.value * 0.18,
  }));

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.kicker}>Live queue</Text>
              <Text style={styles.title}>Finding speaking partner{dots}</Text>
            </View>
            <View style={styles.onlinePill}>
              <UsersRound size={15} color={palette.emeraldDeep} />
              <Text style={styles.onlineText}>{onlineUsers.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.stage}>
            <Animated.View style={[styles.orbGlow, glowStyle]} />
            <Animated.View style={[styles.ring, ringStyle]}>
              <LinearGradient colors={['#07956A', '#4D7CFE', '#8C5CFF', '#07956A']} style={styles.ringGradient} />
            </Animated.View>
            <Animated.View style={[styles.orb, orbStyle]}>
              <LinearGradient colors={['#0FAF7B', '#4D7CFE']} style={styles.orbInner}>
                <Mic size={42} color={palette.surface} />
              </LinearGradient>
            </Animated.View>
            <View style={styles.waveWrap}>
              <VoiceWave active color={palette.blue} />
            </View>
          </View>

          <GlassCard style={styles.queueCard}>
            <View style={styles.queueHead}>
              <Radar size={19} color={palette.emeraldDeep} />
              <Text style={styles.queueTitle}>Scanning compatible speakers</Text>
            </View>
            {candidates.map((candidate) => (
              <View key={candidate.name} style={styles.candidateRow}>
                <View style={styles.candidateAvatar}>
                  <Text style={styles.candidateInitial}>{candidate.name.slice(0, 1)}</Text>
                </View>
                <View style={styles.candidateCopy}>
                  <Text style={styles.candidateName}>{candidate.name}</Text>
                  <Text style={styles.candidateMeta}>voice room available</Text>
                </View>
                <View style={styles.scorePill}>
                  <Sparkles size={13} color={palette.emeraldDeep} />
                  <Text style={styles.scoreText}>{candidate.score}</Text>
                </View>
              </View>
            ))}
          </GlassCard>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable onPress={handleCancel} style={styles.cancel}>
            <PhoneOff size={18} color={palette.text} />
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 22, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  title: { marginTop: 8, maxWidth: 250, color: palette.text, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  onlinePill: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  onlineText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  stage: { height: 350, alignItems: 'center', justifyContent: 'center' },
  orbGlow: {
    position: 'absolute',
    width: 252,
    height: 252,
    borderRadius: 126,
    backgroundColor: 'rgba(77,124,254,0.18)',
  },
  ring: { position: 'absolute', width: 218, height: 218, borderRadius: 109 },
  ringGradient: { flex: 1, borderRadius: 109, opacity: 0.36 },
  orb: { width: 142, height: 142, borderRadius: 71 },
  orbInner: { flex: 1, borderRadius: 71, alignItems: 'center', justifyContent: 'center' },
  waveWrap: { position: 'absolute', bottom: 20 },
  queueCard: { gap: 12 },
  queueHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  queueTitle: { color: palette.text, fontSize: 15, fontWeight: '900' },
  candidateRow: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  candidateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  candidateInitial: { color: palette.emeraldDeep, fontSize: 15, fontWeight: '900' },
  candidateCopy: { flex: 1 },
  candidateName: { color: palette.text, fontSize: 14, fontWeight: '900' },
  candidateMeta: { marginTop: 2, color: palette.muted, fontSize: 12, fontWeight: '700' },
  scorePill: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,201,135,0.1)',
  },
  scoreText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  errorBox: {
    minHeight: 44,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(180,35,24,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(180,35,24,0.16)',
  },
  errorText: { color: '#7A271A', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  cancel: {
    marginTop: 'auto',
    minHeight: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(15,23,42,0.05)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  cancelText: { color: palette.text, fontSize: 15, fontWeight: '900' },
});
