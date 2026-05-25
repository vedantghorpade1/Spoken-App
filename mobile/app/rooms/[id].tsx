import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, Hand, MessageCircle, Mic, MicOff, PhoneOff, Radio, Share2, Sparkles, UserPlus, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, palette } from '@/components/premium-ui';
import { agoraVoiceService, type AgoraCallState } from '@/services/agora';
import { roomsApi } from '@/services/rooms-api';
import { useAudioStore, useLiveRoomStore, useReactionsStore, useRoomChatStore, useRoomStore } from '@/stores/rooms';
import type { LiveRoom, RoomParticipant } from '@/types/rooms';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function asString(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default function RoomDetailScreen() {
  const id = asString(useLocalSearchParams().id, '');
  const rooms = useRoomStore((state) => state.rooms);
  const loadRooms = useRoomStore((state) => state.loadRooms);
  const { activeRoom, elapsed, setActiveRoom, setElapsed } = useLiveRoomStore();
  const { muted, speakerOn, localSpeaking, remoteSpeaking, setMuted, setSpeakerOn, setSpeaking } = useAudioStore();
  const { reactions, pushReaction } = useReactionsStore();
  const { messages, addMessage } = useRoomChatStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [callState, setCallState] = useState<AgoraCallState>('joining');
  const [error, setError] = useState<string | null>(null);
  const elapsedRef = useRef(0);
  const joinedRef = useRef(false);

  const fallbackRoom = rooms.find((room) => room.id === id);
  const room = activeRoom?.id === id ? activeRoom : fallbackRoom;

  useEffect(() => {
    if (!room && id) {
      loadRooms();
    }
  }, [id, loadRooms, room]);

  useEffect(() => {
    if (!id || joinedRef.current) {
      return;
    }

    let mounted = true;
    const unsubscribe = agoraVoiceService.subscribe((event) => {
      if (event.state) {
        setCallState(event.state);
      }
      if (event.error !== undefined) {
        setError(event.error);
      }
      if (event.isLocalSpeaking !== undefined || event.isRemoteSpeaking !== undefined) {
        setSpeaking(Boolean(event.isLocalSpeaking), Boolean(event.isRemoteSpeaking));
      }
    });

    async function joinRoom() {
      try {
        const joinedRoom = await roomsApi.join(id);
        joinedRef.current = true;
        setActiveRoom(joinedRoom);
        await agoraVoiceService.joinChannel(joinedRoom.channelName, joinedRoom.agoraToken ?? '', joinedRoom.uid ?? 0);
        if (mounted) {
          addMessage({
            id: `system-${Date.now()}`,
            roomId: id,
            userId: 'system',
            userName: 'SpeakAI',
            kind: 'system',
            text: 'You joined the live room.',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (joinError) {
        if (mounted) {
          setCallState('failed');
          setError(joinError instanceof Error ? joinError.message : 'Unable to join room.');
        }
      }
    }

    joinRoom();
    return () => {
      mounted = false;
      unsubscribe();
      agoraVoiceService.leaveChannel();
      if (joinedRef.current) {
        roomsApi.leave(id, elapsedRef.current).catch(() => undefined);
      }
    };
  }, [addMessage, id, setActiveRoom, setSpeaking]);

  useEffect(() => {
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [setElapsed]);

  const host = room?.host;
  const speakers = useMemo(() => room?.participants.filter((participant) => participant.role === 'speaker' || participant.role === 'moderator') ?? [], [room?.participants]);
  const listeners = useMemo(() => room?.participants.filter((participant) => participant.role === 'listener') ?? [], [room?.participants]);

  const handleLeave = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await agoraVoiceService.leaveChannel();
    if (id) {
      await roomsApi.leave(id, elapsedRef.current).catch(() => undefined);
    }
    setActiveRoom(null);
    router.replace('/(tabs)/rooms' as never);
  }, [id, setActiveRoom]);

  const toggleMute = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMuted(agoraVoiceService.toggleMute());
  }, [setMuted]);

  const toggleSpeaker = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeakerOn(agoraVoiceService.toggleSpeaker());
  }, [setSpeakerOn]);

  const raiseHand = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (id) {
      roomsApi.raiseHand(id).catch(() => undefined);
    }
  }, [id]);

  const react = useCallback((emoji: string) => {
    pushReaction({ id: `${emoji}-${Date.now()}`, roomId: id, userId: 'me', emoji, createdAt: new Date().toISOString() });
  }, [id, pushReaction]);

  const sendMessage = useCallback(() => {
    if (!draft.trim()) {
      return;
    }
    addMessage({
      id: `msg-${Date.now()}`,
      roomId: id,
      userId: 'me',
      userName: 'You',
      kind: 'message',
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    });
    setDraft('');
  }, [addMessage, draft, id]);

  if (!room) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading room...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['rgba(7,149,106,0.2)', 'rgba(248,250,252,0)', 'rgba(20,201,135,0.1)']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <LinearGradient colors={['rgba(7,149,106,0.96)', 'rgba(20,201,135,0.76)', 'rgba(255,255,255,0.9)']} style={styles.header}>
            <HeaderWave />
            <View style={styles.statusRow}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{callState === 'connected' ? 'LIVE' : 'SYNCING'}</Text>
              </View>
              <Text style={styles.duration}>{formatDuration(elapsed)}</Text>
              <Pressable onPress={handleLeave} style={styles.leavePill}>
                <PhoneOff size={15} color={palette.surface} />
                <Text style={styles.leaveText}>Leave</Text>
              </Pressable>
            </View>
            <Text style={styles.topic}>{room.topic}</Text>
            <Text style={styles.title}>{room.title}</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </LinearGradient>

          <View style={styles.aiStrip}>
            <Insight icon={Sparkles} value="86" label="fluency" />
            <Insight icon={Radio} value={localSpeaking ? 'Live' : 'Ready'} label="speaking" />
            <Insight icon={Mic} value="2.8m" label="talk time" />
          </View>

          {host ? (
            <View style={styles.hostSection}>
              <Text style={styles.sectionTitle}>Host</Text>
              <ParticipantCard participant={host} featured localSpeaking={localSpeaking} />
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active speakers</Text>
            <View style={styles.speakerGrid}>
              {speakers.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} localSpeaking={localSpeaking} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listeners</Text>
            <View style={styles.listenerGrid}>
              {listeners.map((participant) => (
                <ListenerChip key={participant.id} participant={participant} />
              ))}
            </View>
          </View>

          <View style={styles.aiPanel}>
            <Text style={styles.aiTitle}>AI room coach</Text>
            <Text style={styles.aiText}>Pronunciation is steady. Try replacing filler words with short pauses during your next turn.</Text>
            <View style={styles.promptRow}>
              {['Give an example', 'Ask a follow-up', 'Summarize your point'].map((prompt) => (
                <View key={prompt} style={styles.promptPill}>
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <FloatingReactions reactions={reactions.map((reaction) => reaction.emoji)} />
        <BottomControls
          muted={muted}
          speakerOn={speakerOn}
          remoteSpeaking={remoteSpeaking}
          onMute={toggleMute}
          onRaiseHand={raiseHand}
          onChat={() => setChatOpen(true)}
          onSpeaker={toggleSpeaker}
          onReact={react}
          onLeave={handleLeave}
        />
        <ChatSheet visible={chatOpen} messages={messages} draft={draft} setDraft={setDraft} onSend={sendMessage} onClose={() => setChatOpen(false)} />
      </SafeAreaView>
    </View>
  );
}

function HeaderWave() {
  return (
    <View style={styles.headerWave}>
      {Array.from({ length: 18 }).map((_, index) => <WaveBar key={index} index={index} />)}
    </View>
  );
}

function WaveBar({ index }: { index: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withSequence(withTiming(1, { duration: 620 + index * 35 }), withTiming(0, { duration: 620 + index * 35 })), -1, true);
  }, [index, progress]);
  const style = useAnimatedStyle(() => ({ height: 18 + ((index * 13) % 58) + progress.value * 28 }));
  return <Animated.View style={[styles.headerWaveBar, style]} />;
}

function Insight({ icon: Icon, value, label }: { icon: typeof Sparkles; value: string; label: string }) {
  return (
    <View style={styles.insight}>
      <Icon size={16} color={palette.emeraldDeep} />
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightLabel}>{label}</Text>
    </View>
  );
}

function ParticipantCard({ participant, featured, localSpeaking }: { participant: RoomParticipant; featured?: boolean; localSpeaking: boolean }) {
  const speaking = participant.speaking || (participant.id === 'me' && localSpeaking);
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: speaking ? 0.22 + pulse.value * 0.18 : 0.08,
    transform: [{ scale: speaking ? 1 + pulse.value * 0.1 : 1 }],
  }));

  return (
    <View style={[styles.participantCard, featured && styles.participantCardFeatured]}>
      <Animated.View style={[styles.participantGlow, pulseStyle]} />
      <View style={styles.participantAvatarWrap}>
        <Avatar initials={participant.initials} size={featured ? 84 : 68} color={participant.role === 'host' ? palette.emeraldDeep : palette.blue} active={speaking} />
        {participant.role === 'host' ? (
          <View style={styles.roleBadge}>
            <Crown size={11} color={palette.surface} />
          </View>
        ) : null}
      </View>
      <Text style={styles.participantName} numberOfLines={1}>{participant.name}</Text>
      <View style={styles.participantMeta}>
        <Text style={styles.roleText}>{participant.role}</Text>
        <Text style={styles.levelBadge}>{participant.level}</Text>
      </View>
      <View style={styles.micState}>
        {participant.muted ? <MicOff size={13} color={palette.softText} /> : <Mic size={13} color={palette.emeraldDeep} />}
        <Text style={styles.micStateText}>{speaking ? 'Speaking' : participant.muted ? 'Muted' : 'Ready'}</Text>
      </View>
    </View>
  );
}

function ListenerChip({ participant }: { participant: RoomParticipant }) {
  return (
    <View style={styles.listenerChip}>
      <Text style={styles.listenerAvatar}>{participant.initials}</Text>
      <Text style={styles.listenerName} numberOfLines={1}>{participant.name}</Text>
      <Text style={styles.listenerLevel}>{participant.level}</Text>
    </View>
  );
}

function FloatingReactions({ reactions }: { reactions: string[] }) {
  return (
    <View pointerEvents="none" style={styles.reactionLayer}>
      {reactions.slice(-5).map((emoji, index) => (
        <Text key={`${emoji}-${index}`} style={[styles.reactionEmoji, { right: 26 + index * 24, bottom: 110 + index * 42 }]}>{emoji}</Text>
      ))}
    </View>
  );
}

function BottomControls({
  muted,
  speakerOn,
  remoteSpeaking,
  onMute,
  onRaiseHand,
  onChat,
  onSpeaker,
  onReact,
  onLeave,
}: {
  muted: boolean;
  speakerOn: boolean;
  remoteSpeaking: boolean;
  onMute: () => void;
  onRaiseHand: () => void;
  onChat: () => void;
  onSpeaker: () => void;
  onReact: (emoji: string) => void;
  onLeave: () => void;
}) {
  return (
    <View style={styles.bottomBar}>
      <ControlButton active={!muted} danger={false} onPress={onMute} icon={muted ? MicOff : Mic} />
      <ControlButton onPress={onRaiseHand} icon={Hand} />
      <ControlButton onPress={onChat} icon={MessageCircle} />
      <ControlButton active={speakerOn || remoteSpeaking} onPress={onSpeaker} icon={Volume2} />
      <Pressable onPress={() => onReact('🔥')} style={styles.reactionButton}><Text style={styles.reactionButtonText}>🔥</Text></Pressable>
      <ControlButton danger onPress={onLeave} icon={PhoneOff} />
    </View>
  );
}

function ControlButton({ icon: Icon, active, danger, onPress }: { icon: typeof Mic; active?: boolean; danger?: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}>
      <Animated.View style={[styles.controlButton, active && styles.controlButtonActive, danger && styles.controlButtonDanger, style]}>
        <Icon size={20} color={danger || active ? palette.surface : palette.text} />
      </Animated.View>
    </Pressable>
  );
}

function ChatSheet({
  visible,
  messages,
  draft,
  setDraft,
  onSend,
  onClose,
}: {
  visible: boolean;
  messages: ReturnType<typeof useRoomChatStore.getState>['messages'];
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable onPress={onClose} style={styles.chatBackdrop} />
      <View style={styles.chatSheet}>
        <View style={styles.chatHandle} />
        <Text style={styles.chatTitle}>Room chat</Text>
        <ScrollView style={styles.chatList} contentContainerStyle={styles.chatContent}>
          {messages.map((message) => (
            <View key={message.id} style={[styles.chatBubble, message.kind === 'ai' && styles.chatBubbleAi]}>
              <Text style={styles.chatName}>{message.userName}</Text>
              <Text style={styles.chatText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Message the room" placeholderTextColor={palette.softText} style={styles.chatInput} />
          <Pressable onPress={onSend} style={styles.sendButton}>
            <Share2 size={17} color={palette.surface} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 112 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: palette.muted, fontSize: 14, fontWeight: '900' },
  header: { minHeight: 242, borderRadius: 34, padding: 20, overflow: 'hidden', justifyContent: 'space-between', shadowColor: 'rgba(7,149,106,0.22)', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 1, shadowRadius: 30, elevation: 12 },
  headerWave: { position: 'absolute', left: 14, right: 14, bottom: 16, height: 95, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerWaveBar: { width: 7, borderRadius: 8, backgroundColor: palette.surface, opacity: 0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  livePill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.22)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.surface },
  liveText: { color: palette.surface, fontSize: 11, fontWeight: '900' },
  duration: { flex: 1, color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '900' },
  leavePill: { minHeight: 34, borderRadius: 17, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.88)' },
  leaveText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
  topic: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '900' },
  title: { maxWidth: 310, color: palette.surface, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  errorText: { color: '#7F1D1D', fontSize: 12, fontWeight: '900' },
  aiStrip: { marginTop: 14, flexDirection: 'row', gap: 10 },
  insight: { flex: 1, minHeight: 86, borderRadius: 24, padding: 12, justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.09)' },
  insightValue: { color: palette.text, fontSize: 19, fontWeight: '900' },
  insightLabel: { color: palette.muted, fontSize: 10, fontWeight: '900' },
  hostSection: { marginTop: 18 },
  section: { marginTop: 20 },
  sectionTitle: { marginBottom: 10, color: palette.text, fontSize: 19, fontWeight: '900' },
  speakerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  participantCard: { width: '48.5%', minHeight: 178, borderRadius: 28, padding: 14, alignItems: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.09)' },
  participantCardFeatured: { width: '100%', minHeight: 206 },
  participantGlow: { position: 'absolute', width: 158, height: 158, borderRadius: 79, top: -46, backgroundColor: palette.emeraldDeep },
  participantAvatarWrap: { marginTop: 6 },
  roleBadge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.emeraldDeep, borderWidth: 2, borderColor: palette.surface },
  participantName: { marginTop: 12, maxWidth: '92%', color: palette.text, fontSize: 15, fontWeight: '900' },
  participantMeta: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { color: palette.emeraldDeep, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  levelBadge: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, color: palette.emeraldDeep, fontSize: 10, fontWeight: '900', backgroundColor: 'rgba(20,201,135,0.1)' },
  micState: { marginTop: 10, minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(248,250,252,0.9)' },
  micStateText: { color: palette.muted, fontSize: 10, fontWeight: '900' },
  listenerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listenerChip: { minHeight: 42, maxWidth: '48%', borderRadius: 21, paddingLeft: 6, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)' },
  listenerAvatar: { width: 30, height: 30, borderRadius: 15, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: palette.surface, fontSize: 10, fontWeight: '900', backgroundColor: palette.softText },
  listenerName: { flexShrink: 1, color: palette.text, fontSize: 12, fontWeight: '900' },
  listenerLevel: { color: palette.emeraldDeep, fontSize: 10, fontWeight: '900' },
  aiPanel: { marginTop: 20, borderRadius: 28, padding: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.09)' },
  aiTitle: { color: palette.text, fontSize: 17, fontWeight: '900' },
  aiText: { marginTop: 7, color: palette.muted, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  promptRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptPill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: 'rgba(20,201,135,0.1)' },
  promptText: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '900' },
  reactionLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  reactionEmoji: { position: 'absolute', fontSize: 30 },
  bottomBar: { position: 'absolute', left: 14, right: 14, bottom: 14, minHeight: 76, borderRadius: 30, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.1)', shadowColor: 'rgba(7,149,106,0.18)', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 1, shadowRadius: 28, elevation: 16 },
  controlButton: { width: 47, height: 47, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.06)' },
  controlButtonActive: { backgroundColor: palette.emeraldDeep },
  controlButtonDanger: { backgroundColor: '#EF4444' },
  reactionButton: { width: 47, height: 47, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,201,135,0.1)' },
  reactionButtonText: { fontSize: 21 },
  chatBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.24)' },
  chatSheet: { height: '62%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 18, backgroundColor: palette.surface },
  chatHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(15,23,42,0.12)' },
  chatTitle: { marginTop: 14, color: palette.text, fontSize: 21, fontWeight: '900' },
  chatList: { flex: 1, marginTop: 10 },
  chatContent: { gap: 8, paddingBottom: 12 },
  chatBubble: { borderRadius: 18, padding: 12, backgroundColor: 'rgba(248,250,252,0.95)' },
  chatBubbleAi: { backgroundColor: 'rgba(20,201,135,0.1)' },
  chatName: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '900' },
  chatText: { marginTop: 3, color: palette.text, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  chatInputRow: { minHeight: 52, borderRadius: 22, paddingLeft: 14, paddingRight: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248,250,252,0.95)' },
  chatInput: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '800' },
  sendButton: { width: 40, height: 40, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.emeraldDeep },
});
