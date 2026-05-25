import { PhoneCall, RefreshCw, UsersRound } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, GlassCard, Screen, palette } from '@/components/premium-ui';
import { useVoiceCalls } from '@/hooks/use-voice-calls';
import { voiceApi } from '@/services/voice-api';
import type { CallPartner } from '@/types/voice';

export default function OnlineFriendsScreen() {
  const [friends, setFriends] = useState<CallPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const { startFriendCall } = useVoiceCalls();

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      setFriends(await voiceApi.onlineFriends());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const callFriend = useCallback(
    async (friend: CallPartner) => {
      setStatus(`Calling ${friend.name}...`);
      try {
        await startFriendCall(friend.id);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to start call.');
      }
    },
    [startFriendCall],
  );

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <UsersRound size={24} color={palette.emeraldDeep} />
            <View>
              <Text style={styles.kicker}>Online friends</Text>
              <Text style={styles.title}>Call a practice partner</Text>
            </View>
            <Pressable onPress={loadFriends} style={styles.refresh}>
              <RefreshCw size={18} color={palette.text} />
            </Pressable>
          </View>

          {status ? <Text style={styles.status}>{status}</Text> : null}
          {loading ? <Text style={styles.empty}>Loading online friends...</Text> : null}
          {!loading && friends.length === 0 ? <Text style={styles.empty}>No friends are online right now.</Text> : null}

          {friends.map((friend) => (
            <GlassCard key={friend.id} style={styles.friendCard}>
              <View style={styles.friendInfo}>
                <Avatar initials={friend.name.slice(0, 2).toUpperCase()} size={52} color={palette.blue} active />
                <View style={styles.friendCopy}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendMeta}>{friend.email}</Text>
                </View>
              </View>
              <Pressable onPress={() => callFriend(friend)} style={styles.callButton}>
                <PhoneCall size={19} color={palette.surface} />
              </Pressable>
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
  refresh: {
    marginLeft: 'auto',
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  status: { color: palette.blue, fontSize: 13, fontWeight: '800' },
  empty: { marginTop: 24, color: palette.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  friendCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  friendInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendCopy: { flex: 1 },
  friendName: { color: palette.text, fontSize: 16, fontWeight: '900' },
  friendMeta: { marginTop: 3, color: palette.muted, fontSize: 12, fontWeight: '700' },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldDeep,
  },
});
