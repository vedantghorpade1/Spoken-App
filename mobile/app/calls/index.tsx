import { Clock3, History } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, Screen, palette } from '@/components/premium-ui';
import { voiceApi } from '@/services/voice-api';
import type { CallHistoryItem } from '@/types/voice';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function CallHistoryScreen() {
  const [history, setHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    voiceApi
      .callHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <History size={24} color={palette.emeraldDeep} />
            <View>
              <Text style={styles.kicker}>Call history</Text>
              <Text style={styles.title}>Recent voice practice</Text>
            </View>
          </View>

          {loading ? <Text style={styles.empty}>Loading call history...</Text> : null}
          {!loading && history.length === 0 ? <Text style={styles.empty}>Completed calls will appear here.</Text> : null}

          {history.map((item) => (
            <GlassCard key={item.id} style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.partner}>{item.partner.name}</Text>
                <Text style={styles.meta}>{item.call_type} call • {new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <View style={styles.duration}>
                <Clock3 size={14} color={palette.emeraldDeep} />
                <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  title: { marginTop: 4, color: palette.text, fontSize: 28, fontWeight: '900' },
  empty: { marginTop: 24, color: palette.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  left: { flex: 1 },
  partner: { color: palette.text, fontSize: 16, fontWeight: '900' },
  meta: { marginTop: 4, color: palette.muted, fontSize: 12, fontWeight: '700' },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
});
