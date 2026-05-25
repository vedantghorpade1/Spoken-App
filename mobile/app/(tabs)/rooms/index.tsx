import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, Lock, Mic2, Plus, Radio, Search, Sparkles, Users } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useRoomStore } from '@/stores/rooms';
import type { LiveRoom } from '@/types/rooms';

const categories = ['All', 'Casual Talk', 'IELTS', 'Debate', 'Startup Talks', 'Interview Prep', 'Travel English', 'Pronunciation', 'Beginners', 'Advanced Speakers'];

export default function RoomsDiscoveryScreen() {
  const { rooms, loading, selectedCategory, setSelectedCategory, loadRooms } = useRoomStore();

  useEffect(() => {
    loadRooms();
  }, [loadRooms, selectedCategory]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['rgba(7,149,106,0.2)', 'rgba(255,255,255,0)', 'rgba(20,201,135,0.1)']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <Hero loading={loading} roomCount={rooms.length} />
              <CategoryRail selected={selectedCategory} onSelect={setSelectedCategory} />
              <View style={styles.sectionRow}>
                <View>
                  <Text style={styles.sectionKicker}>Live now</Text>
                  <Text style={styles.sectionTitle}>Voice Community</Text>
                </View>
                <Pressable style={styles.searchButton}>
                  <Search size={18} color={palette.emeraldDeep} />
                </Pressable>
              </View>
            </>
          }
          renderItem={({ item }) => <RoomCard room={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {loading ? <ActivityIndicator color={palette.emeraldDeep} /> : <Text style={styles.emptyText}>No live rooms in this category yet.</Text>}
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

function Hero({ loading, roomCount }: { loading: boolean; roomCount: number }) {
  return (
    <LinearGradient colors={['rgba(7,149,106,0.95)', 'rgba(20,201,135,0.82)', 'rgba(255,255,255,0.88)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <WaveformBackdrop />
      <View style={styles.heroTop}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>Live community</Text>
        </View>
        <Pressable onPress={() => router.push('/rooms/create' as never)} style={styles.createButton}>
          <Plus size={18} color={palette.emeraldDeep} />
          <Text style={styles.createText}>Create</Text>
        </Pressable>
      </View>
      <Text style={styles.heroEyebrow}>Rooms are open</Text>
      <Text style={styles.heroTitle}>Join Live English Conversations</Text>
      <Text style={styles.heroSubtitle}>Practice with hosts, speakers, and listeners across focused voice rooms.</Text>
      <View style={styles.heroStats}>
        <StatPill value="2.4k" label="online" icon={Users} />
        <StatPill value={loading ? '...' : String(Math.max(roomCount, 8))} label="active rooms" icon={Radio} />
      </View>
    </LinearGradient>
  );
}

function StatPill({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Users }) {
  return (
    <View style={styles.statPill}>
      <Icon size={15} color={palette.emeraldDeep} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WaveformBackdrop() {
  return (
    <View style={styles.waveBackdrop}>
      {Array.from({ length: 20 }).map((_, index) => (
        <AnimatedWave key={index} index={index} />
      ))}
    </View>
  );
}

function AnimatedWave({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 + index * 18, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900 + index * 18, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    height: 22 + ((index * 17) % 72) + progress.value * 34,
    opacity: 0.13 + progress.value * 0.22,
  }));

  return <Animated.View style={[styles.waveBar, style]} />;
}

function CategoryRail({ selected, onSelect }: { selected: string; onSelect: (category: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
      {categories.map((category) => (
        <CategoryPill key={category} category={category} selected={selected === category} onPress={() => onSelect(category)} />
      ))}
    </ScrollView>
  );
}

function CategoryPill({ category, selected, onPress }: { category: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.03 : scale.value, { damping: 18, stiffness: 260 }) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = 0.96;
      }}
      onPressOut={() => {
        scale.value = 1;
      }}>
      <Animated.View style={[styles.categoryPill, selected && styles.categoryPillActive, style]}>
        <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category}</Text>
      </Animated.View>
    </Pressable>
  );
}

const RoomCard = memo(function RoomCard({ room }: { room: LiveRoom }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/rooms/[id]', params: { id: room.id } } as never)}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 240 });
      }}>
      <Animated.View style={[styles.roomCardShadow, animatedStyle]}>
        <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(236,253,245,0.9)', 'rgba(255,255,255,0.8)']} style={styles.roomCard}>
          <View style={styles.roomCardTop}>
            <View style={styles.livePill}>
              <PulseDot />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
            <View style={styles.levelPill}>
              {room.type !== 'open' ? <Lock size={12} color={palette.emeraldDeep} /> : null}
              <Text style={styles.levelText}>{room.level}</Text>
            </View>
          </View>
          <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>
          <Text style={styles.roomTopic} numberOfLines={1}>{room.topic}</Text>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatarWrap}>
              <Avatar initials={room.host.initials} size={44} color={palette.emeraldDeep} active={room.host.speaking} />
              <View style={styles.crownBadge}>
                <Crown size={10} color={palette.surface} />
              </View>
            </View>
            <View style={styles.hostCopy}>
              <Text style={styles.hostLabel}>Hosted by {room.host.name}</Text>
              <View style={styles.micBars}>
                {Array.from({ length: 5 }).map((_, index) => <MicBar key={index} index={index} />)}
              </View>
            </View>
          </View>
          <View style={styles.roomFooter}>
            <View style={styles.avatarStack}>
              {room.participants.slice(0, 4).map((participant, index) => (
                <View key={participant.id} style={[styles.stackAvatar, { marginLeft: index === 0 ? 0 : -9 }]}>
                  <Text style={styles.stackAvatarText}>{participant.initials}</Text>
                </View>
              ))}
            </View>
            <View style={styles.roomCounts}>
              <Text style={styles.countText}>{room.speakers} speakers</Text>
              <Text style={styles.countDivider}>/</Text>
              <Text style={styles.countText}>{room.listeners} listening</Text>
            </View>
            <View style={styles.joinButton}>
              <Mic2 size={15} color={palette.surface} />
              <Text style={styles.joinText}>Join</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

function PulseDot() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.9 - pulse.value * 0.75,
    transform: [{ scale: 1 + pulse.value * 1.4 }],
  }));

  return (
    <View style={styles.pulseDotWrap}>
      <Animated.View style={[styles.pulseRing, style]} />
      <View style={styles.pulseCore} />
    </View>
  );
}

function MicBar({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(withTiming(1, { duration: 420 + index * 60 }), withTiming(0, { duration: 420 + index * 60 })),
      -1,
      true,
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    height: 5 + ((index * 5) % 14) + progress.value * 12,
  }));

  return <Animated.View style={[styles.micBar, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 118 },
  hero: {
    minHeight: 286,
    borderRadius: 34,
    padding: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(7,149,106,0.28)',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 14,
  },
  waveBackdrop: { position: 'absolute', left: 16, right: 16, bottom: 26, height: 118, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  waveBar: { width: 7, borderRadius: 8, backgroundColor: palette.surface },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: { minHeight: 34, borderRadius: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.24)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.surface },
  liveBadgeText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
  createButton: { minHeight: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.94)' },
  createText: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  heroEyebrow: { marginTop: 30, color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '900' },
  heroTitle: { marginTop: 8, maxWidth: 292, color: palette.surface, fontSize: 34, lineHeight: 38, fontWeight: '900' },
  heroSubtitle: { marginTop: 10, maxWidth: 298, color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  heroStats: { marginTop: 22, flexDirection: 'row', gap: 10 },
  statPill: { minHeight: 42, borderRadius: 21, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)' },
  statValue: { color: palette.text, fontSize: 14, fontWeight: '900' },
  statLabel: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  categoryRail: { paddingVertical: 18, gap: 9 },
  categoryPill: { minHeight: 40, borderRadius: 20, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: 1, borderColor: 'rgba(15,23,42,0.07)' },
  categoryPillActive: { backgroundColor: palette.emeraldDeep, borderColor: 'rgba(7,149,106,0.18)' },
  categoryText: { color: palette.muted, fontSize: 12, fontWeight: '900' },
  categoryTextActive: { color: palette.surface },
  sectionRow: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionKicker: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  sectionTitle: { marginTop: 2, color: palette.text, fontSize: 25, lineHeight: 29, fontWeight: '900' },
  searchButton: { width: 44, height: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.1)' },
  emptyState: { minHeight: 150, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: palette.muted, fontSize: 13, fontWeight: '800' },
  roomCardShadow: { marginBottom: 16, shadowColor: 'rgba(7,149,106,0.16)', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 1, shadowRadius: 28, elevation: 10 },
  roomCard: { borderRadius: 30, padding: 18, borderWidth: 1, borderColor: 'rgba(7,149,106,0.1)', overflow: 'hidden' },
  roomCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(20,201,135,0.12)' },
  livePillText: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '900' },
  pulseDotWrap: { width: 13, height: 13, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 13, height: 13, borderRadius: 7, backgroundColor: palette.emeraldDeep },
  pulseCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.emeraldDeep },
  levelPill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.78)' },
  levelText: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '900' },
  roomTitle: { marginTop: 16, color: palette.text, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  roomTopic: { marginTop: 6, color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  hostRow: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatarWrap: { position: 'relative' },
  crownBadge: { position: 'absolute', right: -2, bottom: -2, width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.emeraldDeep, borderWidth: 2, borderColor: palette.surface },
  hostCopy: { flex: 1, gap: 7 },
  hostLabel: { color: palette.text, fontSize: 13, fontWeight: '900' },
  micBars: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 4 },
  micBar: { width: 4, borderRadius: 4, backgroundColor: palette.emeraldDeep, opacity: 0.72 },
  roomFooter: { marginTop: 18, minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.text, borderWidth: 2, borderColor: palette.surface },
  stackAvatarText: { color: palette.surface, fontSize: 10, fontWeight: '900' },
  roomCounts: { flex: 1, marginLeft: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { color: palette.muted, fontSize: 11, fontWeight: '900' },
  countDivider: { color: palette.softText, fontSize: 11, fontWeight: '900' },
  joinButton: { minHeight: 38, borderRadius: 19, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.emeraldDeep },
  joinText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
});
