import { Flame, Star, TimerReset } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, Metric, Screen, palette } from '@/components/premium-ui';
import { voiceApi } from '@/services/voice-api';
import type { ProgressSummary } from '@/types/voice';

function minutes(seconds: number) {
  return Math.round(seconds / 60).toString();
}

export default function ProgressDashboardScreen() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    voiceApi.progress().then(setProgress);
  }, []);

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>Progress dashboard</Text>
          <Text style={styles.title}>Speaking streak and rewards</Text>

          <View style={styles.metricsRow}>
            <Metric value={String(progress?.streak_count ?? 0)} label="day streak" accent={palette.emeraldDeep} />
            <Metric value={String(progress?.stars ?? 0)} label="reward stars" />
          </View>
          <View style={styles.metricsRow}>
            <Metric value={minutes(progress?.weekly_duration ?? 0)} label="weekly minutes" />
            <Metric value={progress?.last_speaking_date ?? 'none'} label="last call" />
          </View>

          <GlassCard style={styles.rewardCard}>
            <View style={styles.rewardRow}>
              <View style={[styles.icon, { backgroundColor: palette.emeraldSoft }]}>
                <Flame size={22} color={palette.emeraldDeep} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.rewardTitle}>Daily speaking streak</Text>
                <Text style={styles.rewardText}>A completed call updates the streak once per day.</Text>
              </View>
            </View>
            <View style={styles.rewardRow}>
              <View style={[styles.icon, { backgroundColor: 'rgba(248,184,78,0.14)' }]}>
                <Star size={22} color={palette.warning} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.rewardTitle}>Stars earned</Text>
                <Text style={styles.rewardText}>Calls grant at least one star, with longer calls granting more.</Text>
              </View>
            </View>
            <View style={styles.rewardRow}>
              <View style={[styles.icon, { backgroundColor: 'rgba(77,124,254,0.12)' }]}>
                <TimerReset size={22} color={palette.blue} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.rewardTitle}>Weekly duration</Text>
                <Text style={styles.rewardText}>Total call time is tracked for the current week.</Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  title: { color: palette.text, fontSize: 31, lineHeight: 36, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  rewardCard: { gap: 16 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  rewardTitle: { color: palette.text, fontSize: 15, fontWeight: '900' },
  rewardText: { marginTop: 3, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
});
