import { router } from 'expo-router';
import { Radio, Signal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParticipantBubble } from '@/components/ParticipantBubble';
import { VoiceControls } from '@/components/VoiceControls';
import { GlassCard, Screen, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';
import { agoraRoomService, type AgoraCallState } from '@/services/agora-room';
import { roomApi } from '@/services/room-api';
import { usePredefinedRoomStore } from '@/stores/roomStore';

export function VoiceRoomScreen() {
  const { token, user } = useAuth();
  const { activeRoom, participants, setParticipants, setParticipantSpeaking, clearActiveRoom } = usePredefinedRoomStore();
  const [callState, setCallState] = useState<AgoraCallState>('idle');
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [error, setError] = useState<string | null>(null);
  const speakingRef = useRef(false);
  const joinedRef = useRef(false);
  const participantRows = useMemo(() => {
    const rows = [];
    for (let index = 0; index < participants.length; index += 3) {
      rows.push(participants.slice(index, index + 3));
    }
    return rows;
  }, [participants]);

  useEffect(() => {
    if (!activeRoom || !token || !user) {
      router.replace('/(tabs)/rooms' as never);
      return;
    }
    const room = activeRoom;
    const authToken = token;
    const currentUser = user;

    let cancelled = false;
    const unsubscribeAgora = agoraRoomService.subscribeAgora((event) => {
      if (event.state) {
        setCallState(event.state);
      }
      if (event.error) {
        setError(event.error);
      }
      if (event.connectionQuality) {
        setConnectionQuality(event.connectionQuality);
      }
      if (typeof event.isLocalSpeaking === 'boolean' && event.isLocalSpeaking !== speakingRef.current) {
        speakingRef.current = event.isLocalSpeaking;
        setParticipantSpeaking(event.isLocalSpeaking ? currentUser.id : null);
        agoraRoomService.emitSpeaking(event.isLocalSpeaking);
      }
    });

    async function connect() {
      try {
        setError(null);
        const session = await roomApi.join(room.id, currentUser.id);
        if (cancelled) {
          await roomApi.leave(room.id).catch(() => undefined);
          return;
        }
        setParticipants(session.participants);
        agoraRoomService.connectSocket(authToken, room.id, {
          onParticipantJoined: setParticipants,
          onParticipantLeft: setParticipants,
          onMuteChanged: setParticipants,
          onActiveSpeaker: (userId, nextParticipants) => {
            setParticipants(nextParticipants);
            setParticipantSpeaking(userId);
          },
          onReconnect: () => {
            setError(null);
          },
        });
        await agoraRoomService.joinVoice(session.channelName, session.token, session.uid);
        joinedRef.current = true;
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : 'Unable to join voice room.');
        setCallState('failed');
      }
    }

    connect();

    return () => {
      cancelled = true;
      unsubscribeAgora();
    };
  }, [activeRoom, clearActiveRoom, setParticipantSpeaking, setParticipants, token, user]);

  const leaveRoom = useCallback(async () => {
    joinedRef.current = false;
    if (activeRoom) {
      await roomApi.leave(activeRoom.id).catch(() => undefined);
    }
    await agoraRoomService.leaveAll();
    clearActiveRoom();
    router.replace('/(tabs)/rooms' as never);
  }, [activeRoom, clearActiveRoom]);

  useEffect(() => {
    return () => {
      if (joinedRef.current && activeRoom) {
        roomApi.leave(activeRoom.id).catch(() => undefined);
        agoraRoomService.leaveAll().catch(() => undefined);
      }
    };
  }, [activeRoom]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setMuted(true);
        agoraRoomService.muteLocalAudio(true);
      }
    });
    return () => subscription.remove();
  }, []);

  function toggleMute() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    agoraRoomService.muteLocalAudio(nextMuted);
  }

  function toggleSpeaker() {
    const nextSpeaker = !speakerOn;
    setSpeakerOn(nextSpeaker);
    agoraRoomService.setSpeaker(nextSpeaker);
  }

  if (!activeRoom) {
    return (
      <Screen>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color={palette.emeraldDeep} />
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <GlassCard style={styles.header}>
            <View style={styles.liveRow}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <View style={styles.statePill}>
                <Signal size={14} color={palette.emeraldDeep} />
                <Text style={styles.stateText}>{callState === 'connected' ? connectionQuality : callState}</Text>
              </View>
            </View>
            <Text style={styles.roomName}>{activeRoom.name}</Text>
            <Text style={styles.roomDescription}>{activeRoom.description}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </GlassCard>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <View style={styles.countBadge}>
              <Radio size={14} color={palette.emeraldDeep} />
              <Text style={styles.countText}>{participants.length} active</Text>
            </View>
          </View>

          <View style={styles.participantGrid}>
            {participantRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.participantRow}>
                {row.map((participant) => (
                  <ParticipantBubble key={participant.id} participant={participant} local={participant.id === user?.id} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.controlsDock}>
          <VoiceControls
            muted={muted}
            speakerOn={speakerOn}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onLeave={() => {
              Alert.alert('Leave room?', 'You will disconnect from the live voice room.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: leaveRoom },
              ]);
            }}
          />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 152 },
  header: { gap: 12, backgroundColor: 'rgba(255,255,255,0.94)' },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  livePill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.emeraldSoft },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.emeraldDeep },
  liveText: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '900' },
  statePill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(15,23,42,0.05)' },
  stateText: { color: palette.text, fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  roomName: { color: palette.text, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  roomDescription: { color: palette.muted, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  error: { color: '#D92D20', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  sectionRow: { marginTop: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: palette.text, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  countBadge: { minHeight: 34, borderRadius: 17, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.emeraldSoft },
  countText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  participantGrid: { gap: 4 },
  participantRow: { minHeight: 126, flexDirection: 'row', justifyContent: 'space-between' },
  controlsDock: { position: 'absolute', left: 20, right: 20, bottom: 20 },
});
