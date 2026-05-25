import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mic, PhoneCall, ShieldCheck, Sparkles, UsersRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceWave } from '@/components/VoiceWave';
import { GlassCard, Screen, palette } from '@/components/premium-ui';

export default function MatchTabScreen() {
  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.kicker}>Random voice calls</Text>
          <Text style={styles.title}>Practice with someone live</Text>
          <Text style={styles.subtitle}>Start matching, join an Agora voice room, then leave or rematch instantly.</Text>

          <View style={styles.hero}>
            <LinearGradient colors={['#07956A', '#4D7CFE', '#8C5CFF']} style={styles.orb}>
              <Mic size={42} color={palette.surface} />
            </LinearGradient>
            <VoiceWave active color={palette.emeraldDeep} />
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.row}>
              <UsersRound size={20} color={palette.emeraldDeep} />
              <Text style={styles.rowText}>Random partner queue</Text>
            </View>
            <View style={styles.row}>
              <ShieldCheck size={20} color={palette.blue} />
              <Text style={styles.rowText}>Expo dev build plus native Agora</Text>
            </View>
            <View style={styles.row}>
              <Sparkles size={20} color={palette.purple} />
              <Text style={styles.rowText}>AI-style compatibility scoring</Text>
            </View>
          </GlassCard>

          <Pressable onPress={() => router.push('/match')} style={styles.buttonWrap}>
            <LinearGradient colors={['#07956A', '#4D7CFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
              <PhoneCall size={21} color={palette.surface} />
              <Text style={styles.buttonText}>Start Matching</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 22, paddingBottom: 122 },
  kicker: { color: palette.emeraldDeep, fontSize: 13, fontWeight: '900' },
  title: { marginTop: 8, color: palette.text, fontSize: 35, lineHeight: 39, fontWeight: '900' },
  subtitle: { marginTop: 9, color: palette.muted, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  hero: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 22 },
  orb: {
    width: 142,
    height: 142,
    borderRadius: 71,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.emerald,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 34,
    elevation: 12,
  },
  card: { gap: 14 },
  row: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '800' },
  buttonWrap: { marginTop: 16 },
  button: {
    minHeight: 62,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: { color: palette.surface, fontSize: 16, fontWeight: '900' },
});
