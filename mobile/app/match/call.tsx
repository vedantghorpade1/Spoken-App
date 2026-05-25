import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle2, Loader2, Mic, Signal, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CallControls } from '@/components/CallControls';
import { MatchCard } from '@/components/MatchCard';
import { VoiceWave } from '@/components/VoiceWave';
import { Avatar, GlassCard, Screen, palette } from '@/components/premium-ui';
import { agoraVoiceService, type AgoraCallState } from '@/services/agora';
import { voiceApi } from '@/services/voice-api';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function asString(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default function VoiceCallScreen() {
  const params = useLocalSearchParams();
  const callId = asString(params.callId, asString(params.matchId, ''));
  const channelName = asString(params.channelName, 'english_room_demo');
  const agoraToken = asString(params.agoraToken, '');
  const uid = Number(asString(params.uid, '0'));
  const partnerLabel = asString(params.partnerLabel, 'Partner');
  const callType = asString(params.callType, 'random');
  const score = Number(asString(params.score, '94'));

  const [callState, setCallState] = useState<AgoraCallState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const pulse = useSharedValue(0);
  const secondsRef = useRef(0);
  const endedRef = useRef(false);

  const connected = callState === 'connected';
  const status = useMemo(() => {
    if (error) {
      return 'Needs attention';
    }

    if (callState === 'reconnecting') {
      return 'Reconnecting';
    }

    if (connected) {
      return remoteUsers.length > 0 ? 'Partner connected' : 'Room connected';
    }

    return callState === 'joining' || callState === 'initializing' ? 'Joining Agora room' : 'Disconnected';
  }, [callState, connected, error, remoteUsers.length]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  useEffect(() => {
    const unsubscribe = agoraVoiceService.subscribe((event) => {
      if (event.state) {
        setCallState(event.state);
      }

      if (event.error !== undefined) {
        setError(event.error);
      }

      if (event.remoteUsers) {
        setRemoteUsers(event.remoteUsers);
      }

      if (event.connectionQuality) {
        setConnectionQuality(event.connectionQuality);
      }

      if (event.isLocalSpeaking !== undefined) {
        setLocalSpeaking(event.isLocalSpeaking);
      }

      if (event.isRemoteSpeaking !== undefined) {
        setRemoteSpeaking(event.isRemoteSpeaking);
      }
    });

    let mounted = true;

    async function join() {
      try {
        setCallState('joining');
        setError(null);
        let token = agoraToken;
        if (!token && uid) {
          token = (await voiceApi.agoraToken(channelName, uid).catch(() => null)) ?? '';
        }
        await agoraVoiceService.joinChannel(channelName, token, uid);
      } catch (joinError) {
        if (mounted) {
          setCallState('failed');
          setError(joinError instanceof Error ? joinError.message : 'Unable to join voice room.');
        }
      }
    }

    join();

    return () => {
      mounted = false;
      unsubscribe();
      agoraVoiceService.leaveChannel();
      if (callId && !endedRef.current) {
        voiceApi.endCall(callId, secondsRef.current).catch(() => undefined);
      }
    };
  }, [agoraToken, callId, channelName, uid]);

  useEffect(() => {
    if (!connected) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((value) => {
        secondsRef.current = value + 1;
        return value + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        agoraVoiceService.muteLocalAudio(true);
        setMuted(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const speakingGlowStyle = useAnimatedStyle(() => ({
    opacity: (localSpeaking || remoteSpeaking ? 0.3 : 0.12) + pulse.value * 0.18,
    transform: [{ scale: 1 + pulse.value * (localSpeaking || remoteSpeaking ? 0.08 : 0.03) }],
  }));

  const handleLeave = useCallback(async () => {
    endedRef.current = true;
    await agoraVoiceService.leaveChannel();
    if (callId) {
      await voiceApi.endCall(callId, secondsRef.current).catch(() => undefined);
    }
    router.replace('/match');
  }, [callId]);

  const handleRematch = useCallback(async () => {
    endedRef.current = true;
    await agoraVoiceService.leaveChannel();
    if (callId) {
      await voiceApi.endCall(callId, secondsRef.current).catch(() => undefined);
    }
    router.replace('/match/searching');
  }, [callId]);

  const handleMute = useCallback(() => {
    setMuted(agoraVoiceService.toggleMute());
  }, []);

  const handleSpeaker = useCallback(() => {
    setSpeakerOn(agoraVoiceService.toggleSpeaker());
  }, []);

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, connected && styles.statusDotConnected]} />
            <Text style={styles.statusText}>{status}</Text>
            <Text style={styles.timer}>{formatDuration(seconds)}</Text>
          </View>

          {callState === 'reconnecting' ? (
            <View style={styles.reconnect}>
              <Loader2 size={16} color={palette.blue} />
              <Text style={styles.reconnectText}>Network changed. Reconnecting to the room.</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={18} color="#B42318" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <MatchCard partnerLabel={partnerLabel} score={callType === 'random' ? score : 100} channelName={channelName} />

          <GlassCard style={styles.callCard}>
            <View style={styles.callHeader}>
              <View style={styles.callTitleWrap}>
                <Text style={styles.callTitle}>Live voice room</Text>
                <Text style={styles.callSubtitle}>{remoteUsers.length > 0 ? 'Two speakers active' : 'Waiting for partner audio'}</Text>
              </View>
              <View style={styles.signalPill}>
                <Signal size={14} color={palette.emeraldDeep} />
                <Text style={styles.signalText}>{connected ? connectionQuality : 'Syncing'}</Text>
              </View>
            </View>

            <View style={styles.avatarStage}>
              <Animated.View style={[styles.speakingGlow, speakingGlowStyle]} />
              <View style={styles.avatarPair}>
                <View style={styles.person}>
                  <Avatar initials="ME" size={86} color={muted ? palette.softText : palette.emeraldDeep} active={localSpeaking && !muted} />
                  <View style={styles.personLabelRow}>
                    <Mic size={14} color={muted ? palette.softText : palette.emeraldDeep} />
                    <Text style={styles.personLabel}>{muted ? 'Muted' : localSpeaking ? 'Speaking' : 'You'}</Text>
                  </View>
                </View>
                <LinearGradient colors={['rgba(7,149,106,0.16)', 'rgba(77,124,254,0.16)']} style={styles.bridge}>
                  <CheckCircle2 size={18} color={palette.emeraldDeep} />
                </LinearGradient>
                <View style={styles.person}>
                  <Avatar
                    initials={partnerLabel.slice(0, 2).toUpperCase()}
                    size={86}
                    color={remoteUsers.length > 0 ? palette.blue : palette.softText}
                    active={remoteSpeaking}
                  />
                  <View style={styles.personLabelRow}>
                    <UserRound size={14} color={remoteUsers.length > 0 ? palette.blue : palette.softText} />
                    <Text style={styles.personLabel}>{remoteSpeaking ? 'Speaking' : partnerLabel}</Text>
                  </View>
                </View>
              </View>
              <VoiceWave active={connected} color={remoteSpeaking ? palette.blue : palette.emeraldDeep} />
            </View>
          </GlassCard>

          <CallControls
            muted={muted}
            speakerOn={speakerOn}
            onToggleMute={handleMute}
            onToggleSpeaker={handleSpeaker}
            onLeave={handleLeave}
            onRematch={handleRematch}
          />

          {callState === 'failed' ? (
            <Pressable onPress={handleRematch} style={styles.retryButton}>
              <Text style={styles.retryText}>Find another partner</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 28, gap: 14 },
  statusRow: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.warning },
  statusDotConnected: { backgroundColor: palette.emeraldDeep },
  statusText: { flex: 1, color: palette.text, fontSize: 13, fontWeight: '900' },
  timer: { color: palette.muted, fontSize: 13, fontWeight: '900' },
  reconnect: {
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(77,124,254,0.1)',
  },
  reconnectText: { flex: 1, color: palette.text, fontSize: 12, fontWeight: '800' },
  errorBox: {
    minHeight: 48,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(180,35,24,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(180,35,24,0.16)',
  },
  errorText: { flex: 1, color: '#7A271A', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  callCard: { gap: 18 },
  callHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  callTitleWrap: { flex: 1 },
  callTitle: { color: palette.text, fontSize: 20, fontWeight: '900' },
  callSubtitle: { marginTop: 4, color: palette.muted, fontSize: 13, fontWeight: '700' },
  signalPill: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.emeraldSoft,
  },
  signalText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  avatarStage: { minHeight: 242, alignItems: 'center', justifyContent: 'center', gap: 16 },
  speakingGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(77,124,254,0.18)',
  },
  avatarPair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  person: { width: 106, alignItems: 'center', gap: 9 },
  personLabelRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  personLabel: { color: palette.text, fontSize: 12, fontWeight: '900' },
  bridge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    minHeight: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(77,124,254,0.1)',
  },
  retryText: { color: palette.blue, fontSize: 14, fontWeight: '900' },
});
