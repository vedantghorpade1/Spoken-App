import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, GlassCard, palette } from '@/components/premium-ui';

type MatchCardProps = {
  partnerLabel: string;
  score: number;
  channelName: string;
};

export function MatchCard({ partnerLabel, score, channelName }: MatchCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Avatar initials={partnerLabel.slice(0, 2).toUpperCase()} size={64} color={palette.emeraldDeep} active />
        <View style={styles.copy}>
          <Text style={styles.title}>Partner Ready</Text>
          <Text style={styles.subtitle}>{partnerLabel} joined your practice room</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <LinearGradient colors={['rgba(7,149,106,0.14)', 'rgba(77,124,254,0.14)']} style={styles.scoreBox}>
          <Sparkles size={18} color={palette.emeraldDeep} />
          <Text style={styles.score}>{score}%</Text>
          <Text style={styles.scoreLabel}>AI compatibility</Text>
        </LinearGradient>
        <View style={styles.detailBox}>
          <ShieldCheck size={18} color={palette.blue} />
          <Text style={styles.detailText}>Private live voice</Text>
        </View>
        <View style={styles.detailBox}>
          <MessageCircle size={18} color={palette.purple} />
          <Text style={styles.detailText}>{channelName}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  metrics: {
    gap: 10,
  },
  scoreBox: {
    minHeight: 92,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'center',
  },
  score: {
    marginTop: 6,
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  scoreLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailBox: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  detailText: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
