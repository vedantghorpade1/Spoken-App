import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit3, Share2, UserPlus } from 'lucide-react-native';

import { Avatar, GlassCard, Metric, Pill, Screen, SectionHeader, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

const badges = ['Interview Pro', 'Room Host', 'Fluency Builder', '7 Day Streak'];

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <GlassCard style={styles.header}>
            <View style={styles.profileTop}>
              <Avatar initials={(user?.name || 'SA').slice(0, 2).toUpperCase()} size={92} color={palette.purple} active />
              <View style={styles.profileCopy}>
                <Text style={styles.name}>{user?.name || 'SpeakAI User'}</Text>
                <Text style={styles.bio}>Building confident English for interviews, travel, and global work.</Text>
                <Pill label="English level B2+" icon="school" active />
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.actionButton}>
                <Edit3 size={16} color={palette.surface} />
                <Text style={styles.actionText}>Edit profile</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <Share2 size={16} color={palette.text} />
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <UserPlus size={16} color={palette.text} />
              </Pressable>
            </View>
          </GlassCard>

          <View style={styles.metricsRow}>
            <Metric value="12.8k" label="followers" />
            <Metric value="248" label="following" />
          </View>
          <View style={styles.metricsRow}>
            <Metric value="1,240" label="XP" accent={palette.emeraldDeep} />
            <Metric value="24" label="day streak" />
          </View>

          <SectionHeader title="Achievements" />
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <GlassCard key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </GlassCard>
            ))}
          </View>

          <SectionHeader title="Practice stats" />
          <GlassCard style={styles.stats}>
            {[
              ['Speaking hours', '156h'],
              ['Voice matches', '342'],
              ['AI feedback sessions', '89'],
              ['Average confidence', '91%'],
            ].map(([label, value]) => (
              <View key={label} style={styles.statLine}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
              </View>
            ))}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 122 },
  header: { gap: 18 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileCopy: { flex: 1, gap: 8 },
  name: { color: palette.text, fontSize: 25, lineHeight: 29, fontWeight: '900' },
  bio: { color: palette.muted, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.text,
  },
  actionText: { color: palette.surface, fontSize: 14, fontWeight: '900' },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.05)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  metricsRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '48%', minHeight: 86, justifyContent: 'center' },
  badgeText: { color: palette.text, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  stats: { gap: 14 },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
  },
  statLabel: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  statValue: { color: palette.text, fontSize: 15, fontWeight: '900' },
});
