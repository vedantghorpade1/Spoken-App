import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { GlassCard, Metric, Pill, Screen, SectionHeader, palette } from '@/components/premium-ui';

const weekly = [42, 48, 61, 55, 69, 74, 81];
const bars = [30, 45, 58, 66, 72, 63, 79];

export default function AnalyticsScreen() {
  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Growth dashboard</Text>
          <Text style={styles.title}>Track spoken English progress</Text>
          <Text style={styles.subtitle}>Beautiful analytics for confidence, fluency, pronunciation, and AI feedback history.</Text>

          <View style={styles.metricsRow}>
            <Metric value="91" label="speaking score" accent={palette.emeraldDeep} />
            <Metric value="88" label="confidence" />
          </View>
          <View style={styles.metricsRow}>
            <Metric value="84" label="pronunciation" />
            <Metric value="77" label="grammar" />
          </View>

          <SectionHeader title="Growth graph" action="7 days" />
          <GlassCard style={styles.chartCard}>
            <Svg width="100%" height={180} viewBox="0 0 320 180">
              <Path
                d="M12 142 C54 120 70 116 92 104 C126 84 142 88 166 72 C202 50 218 62 248 44 C278 28 298 34 312 22"
                stroke={palette.emeraldDeep}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M12 142 C54 120 70 116 92 104 C126 84 142 88 166 72 C202 50 218 62 248 44 C278 28 298 34 312 22 L312 168 L12 168 Z"
                fill="rgba(16,185,129,0.13)"
              />
            </Svg>
          </GlassCard>

          <SectionHeader title="Skill bars" action="Weekly" />
          <GlassCard style={styles.chartCard}>
            <Svg width="100%" height={180} viewBox="0 0 320 180">
              {bars.map((value, index) => (
                <Rect
                  key={index}
                  x={18 + index * 43}
                  y={160 - value * 1.6}
                  width={24}
                  height={value * 1.6}
                  rx={12}
                  fill={index > 4 ? palette.emeraldDeep : palette.blue}
                />
              ))}
            </Svg>
          </GlassCard>

          <SectionHeader title="Skill radar" action="AI score" />
          <GlassCard style={styles.chartCard}>
            <Svg width="100%" height={190} viewBox="0 0 320 190">
              <Polygon points="160,20 275,82 232,166 88,166 45,82" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth={2} />
              <Polygon points="160,48 238,92 210,142 105,145 82,96" fill="rgba(16,185,129,0.16)" stroke={palette.emeraldDeep} strokeWidth={3} />
              <Line x1="160" y1="20" x2="160" y2="166" stroke="rgba(15,23,42,0.08)" />
              <Line x1="45" y1="82" x2="275" y2="82" stroke="rgba(15,23,42,0.08)" />
              <Circle cx="160" cy="48" r={5} fill={palette.emeraldDeep} />
              <Circle cx="238" cy="92" r={5} fill={palette.emeraldDeep} />
              <Circle cx="210" cy="142" r={5} fill={palette.emeraldDeep} />
              <Circle cx="105" cy="145" r={5} fill={palette.emeraldDeep} />
              <Circle cx="82" cy="96" r={5} fill={palette.emeraldDeep} />
            </Svg>
          </GlassCard>

          <SectionHeader title="AI feedback history" />
          <GlassCard style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Weak words</Text>
            <View style={styles.pillRow}>
              <Pill label="actually" />
              <Pill label="maybe" />
              <Pill label="like" />
            </View>
            <Text style={styles.feedbackTitle}>Vocabulary suggestions</Text>
            <Text style={styles.feedbackText}>Replace filler words with clearer transitions and stronger examples.</Text>
            <Text style={styles.feedbackTitle}>Pronunciation corrections</Text>
            <Text style={styles.feedbackText}>Work on final consonants and pauses between long phrases.</Text>
          </GlassCard>

          <SectionHeader title="Activity heatmap" />
          <GlassCard style={styles.heatmapCard}>
            <View style={styles.heatmap}>
              {Array.from({ length: 28 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    { opacity: 0.18 + ((index % 7) * 0.11) },
                  ]}
                />
              ))}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 122 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '800' },
  title: { marginTop: 8, color: palette.text, fontSize: 32, lineHeight: 36, fontWeight: '900' },
  subtitle: { marginTop: 8, color: palette.muted, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  chartCard: { marginTop: 10, paddingVertical: 14 },
  feedbackCard: { gap: 10 },
  feedbackTitle: { color: palette.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  feedbackText: { color: palette.muted, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heatmapCard: { marginTop: 4 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: palette.emeraldDeep,
  },
});
