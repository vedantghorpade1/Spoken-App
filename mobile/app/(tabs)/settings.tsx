import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Eye, Headphones, Lock, LogOut, Mic2, Palette, Shield, SlidersHorizontal, Trash2 } from 'lucide-react-native';

import { GlassCard, Screen, SectionHeader, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

const groups = [
  {
    title: 'Account',
    items: [
      ['Edit profile', Eye],
      ['Change password', Lock],
      ['Email settings', Bell],
    ],
  },
  {
    title: 'App',
    items: [
      ['Notifications', Bell],
      ['Language', SlidersHorizontal],
      ['Appearance', Palette],
      ['Voice preferences', Mic2],
    ],
  },
  {
    title: 'Voice settings',
    items: [
      ['Mic sensitivity', Mic2],
      ['Audio quality', Headphones],
      ['Speaker mode', SlidersHorizontal],
    ],
  },
  {
    title: 'AI settings',
    items: [
      ['AI coach voice', Headphones],
      ['AI feedback level', SlidersHorizontal],
      ['Speaking goals', Shield],
    ],
  },
  {
    title: 'Privacy',
    items: [
      ['Blocked users', Shield],
      ['Data privacy', Lock],
      ['Account visibility', Eye],
    ],
  },
  {
    title: 'Support',
    items: [
      ['Help center', Headphones],
      ['Contact support', Bell],
      ['Report issue', Shield],
    ],
  },
] as const;

export default function SettingsScreen() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Settings</Text>
          <Text style={styles.title}>Control your SpeakAI experience</Text>

          {groups.map((group) => (
            <View key={group.title}>
              <SectionHeader title={group.title} />
              <GlassCard style={styles.groupCard}>
                {group.items.map(([label, Icon]) => (
                  <View key={label} style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <Icon size={18} color={palette.emeraldDeep} />
                    </View>
                    <Text style={styles.settingLabel}>{label}</Text>
                    <View style={styles.chevron} />
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}

          <SectionHeader title="Danger zone" />
          <GlassCard style={styles.dangerCard}>
            <Pressable onPress={handleLogout} style={styles.dangerRow}>
              <LogOut size={18} color={palette.emeraldDeep} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
            <View style={styles.dangerRow}>
              <Trash2 size={18} color="#D92D20" />
              <Text style={styles.deleteText}>Delete account</Text>
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
  title: { marginTop: 8, color: palette.text, fontSize: 31, lineHeight: 35, fontWeight: '900' },
  groupCard: { gap: 4 },
  settingRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  settingLabel: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '800' },
  chevron: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: palette.softText,
    transform: [{ rotate: '45deg' }],
  },
  dangerCard: { gap: 6 },
  dangerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: { color: palette.emeraldDeep, fontSize: 14, fontWeight: '900' },
  deleteText: { color: '#D92D20', fontSize: 14, fontWeight: '900' },
});
