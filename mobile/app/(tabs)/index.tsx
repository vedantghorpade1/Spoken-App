import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Bell,
  BookOpenCheck,
  ChevronRight,
  Flame,
  GraduationCap,
  MessageCircleMore,
  Mic,
  Play,
  Radar,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { Avatar, GlassCard, Pill, Screen, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const quickActions: Array<{ label: string; meta: string; icon: IconComponent; onPress?: () => void }> = [
  { label: 'Random Match', meta: 'Find speaking partners', icon: Radar, onPress: () => router.push('/match/searching') },
  { label: 'Join Voice Room', meta: 'Enter live rooms', icon: MessageCircleMore, onPress: () => router.push('/match') },
  { label: 'AI Interview', meta: 'Practice role play', icon: Sparkles },
  { label: 'Group Discussion', meta: 'Join small circles', icon: Users },
  { label: 'Pronunciation Test', meta: 'Get voice feedback', icon: Mic },
  { label: 'Grammar Practice', meta: 'Sharpen daily drills', icon: GraduationCap },
];

const topics = ['Job interviews', 'Travel English', 'Startup stories', 'Daily fluency'];

const lessons = [
  { title: 'Pronunciation test', meta: '8 min • voice score', icon: Mic },
  { title: 'Interview warmup', meta: '12 min • AI coach', icon: Sparkles },
  { title: 'Grammar sprint', meta: '6 min • quick wins', icon: BookOpenCheck },
];

function firstName(name?: string | null) {
  return name?.trim().split(' ')[0] || 'Vedant';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const name = firstName(user?.name);
  const initials = (user?.name || 'Vedant').slice(0, 2).toUpperCase();
  const horizontalPadding = 40;
  const actionGap = 12;
  const actionCardWidth = Math.floor((width - horizontalPadding - actionGap) / 2);

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.identity}>
              <Avatar initials={initials} size={54} color={palette.emeraldDeep} active />
              <View style={styles.greetingCopy}>
                <Text style={styles.eyebrow}>SpeakAI practice</Text>
                <Text style={styles.title}>Hello, {name}</Text>
              </View>
            </View>
            <Pressable style={styles.bellButton}>
              <Bell size={19} color={palette.text} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <GlassCard style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View>
                <Text style={styles.profileLabel}>English level</Text>
                <Text style={styles.levelText}>B2+ Fluent Builder</Text>
              </View>
              <Pill label="24 day streak" icon="fire" active />
            </View>
            <View style={styles.statStrip}>
              <MiniStat icon={Zap} value="1,240" label="XP" />
              <MiniStat icon={Flame} value="24" label="Streak" />
              <MiniStat icon={Trophy} value="91%" label="Confidence" />
            </View>
          </GlassCard>

          <SpeakingProgressCard />

          <SectionTitle title="Quick Actions" action="All tools" />
          <FlatList
            data={quickActions}
            keyExtractor={(item) => item.label}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.actionsRow}
            contentContainerStyle={styles.actionsGrid}
            renderItem={({ item }) => <ActionCard action={item} width={actionCardWidth} />}
          />

          <SectionTitle title="Live activity" action="Realtime" />
          <View style={styles.activityRow}>
            <ActivityCard value="1.8k" label="Learners online" />
            <ActivityCard value="64" label="Active rooms" />
          </View>
          <GlassCard style={styles.livePanel}>
            <View style={styles.liveHeader}>
              <View style={styles.livePulse} />
              <Text style={styles.liveTitle}>Trending now</Text>
              <Text style={styles.liveMeta}>updated live</Text>
            </View>
            <View style={styles.topicWrap}>
              {topics.map((topic) => (
                <View key={topic} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <SectionTitle title="AI insights" action="+12% this week" />
          <GlassCard style={styles.insightCard}>
            <View style={styles.insightTop}>
              <View>
                <Text style={styles.insightTitle}>Speaking confidence</Text>
                <Text style={styles.insightSub}>Clearer answers and fewer long pauses.</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreValue}>91</Text>
              </View>
            </View>
            <InsightChart />
            <View style={styles.insightStats}>
              <InsightStat label="Pronunciation" value="84" />
              <InsightStat label="Fluency" value="88" />
              <InsightStat label="Grammar" value="77" />
            </View>
            <Heatmap />
          </GlassCard>

          <SectionTitle title="Daily challenge" action="120 XP" />
          <GlassCard style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeIcon}>
                <Flame size={22} color={palette.emeraldDeep} />
              </View>
              <View style={styles.challengeCopy}>
                <Text style={styles.challengeTitle}>Finish one speaking call</Text>
                <Text style={styles.challengeText}>Keep your streak active and unlock bonus stars.</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.challengeFooter}>
              <Text style={styles.challengeMeta}>68% complete</Text>
              <Text style={styles.rewardText}>+120 XP</Text>
            </View>
          </GlassCard>

          <SectionTitle title="Continue learning" action="View all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lessonRow}>
            {lessons.map((lesson) => (
              <LessonCard key={lesson.title} lesson={lesson} />
            ))}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable style={styles.sectionActionButton}>
          <Text style={styles.sectionAction}>{action}</Text>
          <ChevronRight size={14} color={palette.emeraldDeep} />
        </Pressable>
      ) : null}
    </View>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: IconComponent; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Icon size={15} color={palette.emeraldDeep} />
      <View>
        <Text style={styles.miniValue}>{value}</Text>
        <Text style={styles.miniLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SpeakingProgressCard() {
  return (
    <LinearGradient colors={['#07956A', '#14C987']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressKicker}>Speaking progress</Text>
          <Text style={styles.progressTitle}>Your voice is getting sharper</Text>
        </View>
        <View style={styles.confidenceCircle}>
          <Text style={styles.confidenceValue}>91</Text>
          <Text style={styles.confidenceLabel}>score</Text>
        </View>
      </View>
      <AnimatedWaveform />
      <View style={styles.aiMessage}>
        <Sparkles size={15} color={palette.emeraldDeep} />
        <Text style={styles.aiMessageText}>AI coach: stronger pacing today. Try one longer answer.</Text>
      </View>
      <Pressable onPress={() => router.push('/match/searching')} style={styles.primaryCta}>
        <Play size={17} color={palette.emeraldDeep} fill={palette.emeraldDeep} />
        <Text style={styles.primaryCtaText}>Start Practice</Text>
        <ChevronRight size={17} color={palette.emeraldDeep} />
      </Pressable>
    </LinearGradient>
  );
}

function AnimatedWaveform() {
  return (
    <View style={styles.waveform}>
      {Array.from({ length: 24 }).map((_, index) => (
        <AnimatedBar key={index} index={index} />
      ))}
    </View>
  );
}

function AnimatedBar({ index }: { index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 45,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 720, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 720, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    height: 12 + ((index * 11) % 38) + progress.value * 18,
    opacity: 0.48 + progress.value * 0.46,
  }));

  return <Animated.View style={[styles.waveBar, style]} />;
}

function ActionCard({ action, width }: { action: (typeof quickActions)[number]; width: number }) {
  const Icon = action.icon;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={action.onPress}
      onPressIn={() => {
        scale.value = withSpring(0.965, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 240 });
      }}
      style={[styles.actionPressable, { width }]}>
      <Animated.View style={[styles.actionCard, animatedStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(20,201,135,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGradient}>
          <View style={styles.actionIcon}>
            <Icon size={28} color={palette.emeraldDeep} strokeWidth={2.35} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
            <Text style={styles.actionMeta} numberOfLines={1}>
              {action.meta}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function ActivityCard({ value, label }: { value: string; label: string }) {
  return (
    <GlassCard style={styles.activityCard}>
      <View style={styles.activityBadge}>
        <Users size={16} color={palette.emeraldDeep} />
      </View>
      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activityLabel}>{label}</Text>
    </GlassCard>
  );
}

function InsightChart() {
  return (
    <View style={styles.chartBox}>
      <Svg width="100%" height={124} viewBox="0 0 320 124">
        <Defs>
          <SvgGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14C987" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#14C987" stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <Path d="M12 91 C42 82 62 72 88 76 C122 82 136 46 166 49 C198 52 208 30 238 34 C270 38 284 18 308 22" stroke={palette.emeraldDeep} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M12 91 C42 82 62 72 88 76 C122 82 136 46 166 49 C198 52 208 30 238 34 C270 38 284 18 308 22 L308 116 L12 116 Z" fill="url(#lineFill)" />
        {[42, 88, 166, 238, 308].map((x, index) => (
          <Circle key={x} cx={x} cy={[82, 76, 49, 34, 22][index]} r={4} fill={palette.surface} stroke={palette.emeraldDeep} strokeWidth={3} />
        ))}
      </Svg>
    </View>
  );
}

function InsightStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.insightStat}>
      <Text style={styles.insightStatValue}>{value}</Text>
      <Text style={styles.insightStatLabel}>{label}</Text>
    </View>
  );
}

function Heatmap() {
  return (
    <View style={styles.heatmap}>
      {Array.from({ length: 21 }).map((_, index) => (
        <View key={index} style={[styles.heatCell, { opacity: 0.2 + ((index % 5) * 0.14) }]} />
      ))}
    </View>
  );
}

function LessonCard({ lesson }: { lesson: (typeof lessons)[number] }) {
  const Icon = lesson.icon;
  return (
    <GlassCard style={styles.lessonCard}>
      <View style={styles.lessonIcon}>
        <Icon size={21} color={palette.emeraldDeep} />
      </View>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.lessonMeta}>{lesson.meta}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 124 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  greetingCopy: { flex: 1 },
  eyebrow: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  title: { marginTop: 3, color: palette.text, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: palette.stroke,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  bellDot: { position: 'absolute', top: 12, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: palette.emeraldDeep },
  profileCard: { marginTop: 18, padding: 16, borderRadius: 26, gap: 15 },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  profileLabel: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  levelText: { marginTop: 4, color: palette.text, fontSize: 19, fontWeight: '900' },
  statStrip: { flexDirection: 'row', gap: 9 },
  miniStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 19,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,201,135,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20,201,135,0.11)',
  },
  miniValue: { color: palette.text, fontSize: 14, fontWeight: '900' },
  miniLabel: { marginTop: 1, color: palette.muted, fontSize: 10, fontWeight: '800' },
  progressCard: {
    marginTop: 16,
    borderRadius: 30,
    padding: 18,
    gap: 16,
    shadowColor: 'rgba(7,149,106,0.28)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 14,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  progressKicker: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '900' },
  progressTitle: { marginTop: 4, maxWidth: 210, color: palette.surface, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  confidenceCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  confidenceValue: { color: palette.surface, fontSize: 23, fontWeight: '900' },
  confidenceLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: '900' },
  waveform: {
    height: 88,
    borderRadius: 24,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  waveBar: { width: 5, borderRadius: 4, backgroundColor: palette.surface },
  aiMessage: {
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  aiMessageText: { flex: 1, color: palette.text, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  primaryCta: {
    minHeight: 54,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.surface,
  },
  primaryCtaText: { color: palette.emeraldDeep, fontSize: 15, fontWeight: '900' },
  sectionTitleRow: {
    marginTop: 26,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: palette.text, fontSize: 21, lineHeight: 25, fontWeight: '900', letterSpacing: 0 },
  sectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(20,201,135,0.08)',
  },
  sectionAction: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  actionsGrid: { paddingBottom: 2 },
  actionsRow: { gap: 12 },
  actionPressable: {
    marginBottom: 12,
  },
  actionCard: {
    height: 154,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(7,149,106,0.16)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 9,
  },
  actionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20,201,135,0.14)',
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(20,201,135,0.12)',
  },
  actionCopy: { gap: 4 },
  actionLabel: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  actionMeta: { color: palette.muted, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  activityRow: { flexDirection: 'row', gap: 10 },
  activityCard: { flex: 1, minHeight: 116, borderRadius: 24, justifyContent: 'space-between' },
  activityBadge: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  activityValue: { color: palette.text, fontSize: 30, fontWeight: '900' },
  activityLabel: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  livePanel: { marginTop: 10, borderRadius: 24, gap: 12 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  livePulse: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.emeraldDeep },
  liveTitle: { flex: 1, color: palette.text, fontSize: 15, fontWeight: '900' },
  liveMeta: { color: palette.muted, fontSize: 11, fontWeight: '800' },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,201,135,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20,201,135,0.12)',
  },
  topicText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  insightCard: { borderRadius: 26, gap: 14 },
  insightTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  insightTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
  insightSub: { marginTop: 4, maxWidth: 210, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  scoreBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  scoreValue: { color: palette.emeraldDeep, fontSize: 23, fontWeight: '900' },
  chartBox: { height: 124, borderRadius: 22, backgroundColor: 'rgba(20,201,135,0.05)', overflow: 'hidden' },
  insightStats: { flexDirection: 'row', gap: 8 },
  insightStat: { flex: 1, borderRadius: 18, padding: 10, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: palette.stroke },
  insightStatValue: { color: palette.text, fontSize: 20, fontWeight: '900' },
  insightStatLabel: { marginTop: 2, color: palette.muted, fontSize: 10, fontWeight: '800' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  heatCell: { width: 22, height: 22, borderRadius: 8, backgroundColor: palette.emeraldDeep },
  challengeCard: { borderRadius: 26, gap: 14 },
  challengeHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  challengeIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.emeraldSoft },
  challengeCopy: { flex: 1 },
  challengeTitle: { color: palette.text, fontSize: 17, fontWeight: '900' },
  challengeText: { marginTop: 4, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(20,201,135,0.12)', overflow: 'hidden' },
  progressFill: { width: '68%', height: '100%', borderRadius: 5, backgroundColor: palette.emeraldDeep },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  challengeMeta: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  rewardText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  lessonRow: { gap: 12, paddingRight: 20 },
  lessonCard: { width: 178, minHeight: 138, borderRadius: 24, justifyContent: 'space-between' },
  lessonIcon: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.emeraldSoft },
  lessonTitle: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  lessonMeta: { color: palette.muted, fontSize: 11, fontWeight: '800' },
});
