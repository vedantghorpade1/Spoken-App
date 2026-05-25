import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Radio, Users } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoomCard } from '@/components/RoomCard';
import { Screen, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';
import { usePredefinedRoomStore } from '@/stores/roomStore';

export function RoomsScreen() {
  const { user } = useAuth();
  const { rooms, loading, joiningRoomId, error, loadRooms, joinRoom, setActiveSession } = usePredefinedRoomStore();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  async function handleJoin(roomId: string) {
    if (!user?.id) {
      return;
    }
    const session = await joinRoom(roomId, user.id);
    setActiveSession(session);
    router.push('/rooms/voice' as never);
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={rooms}
          keyExtractor={(room) => room.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <LinearGradient colors={['rgba(7,149,106,0.96)', 'rgba(20,201,135,0.78)', 'rgba(140,92,255,0.22)']} style={styles.hero}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>Live voice rooms</Text>
              </View>
              <Text style={styles.title}>Join English Practice Rooms</Text>
              <Text style={styles.subtitle}>Choose one of four always-ready Agora rooms and start speaking with other learners.</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Radio size={16} color={palette.emeraldDeep} />
                  <Text style={styles.statText}>4 live rooms</Text>
                </View>
                <View style={styles.stat}>
                  <Users size={16} color={palette.emeraldDeep} />
                  <Text style={styles.statText}>{rooms.reduce((sum, room) => sum + room.participants, 0)} active</Text>
                </View>
              </View>
            </LinearGradient>
          }
          renderItem={({ item }) => (
            <RoomCard room={item} joining={joiningRoomId === item.id} onJoin={() => handleJoin(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              {loading ? <ActivityIndicator color={palette.emeraldDeep} /> : <Text style={styles.emptyText}>{error || 'No rooms available.'}</Text>}
            </View>
          }
        />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 118 },
  hero: {
    minHeight: 230,
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(7,149,106,0.24)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 14,
  },
  livePill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.surface },
  livePillText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
  title: { marginTop: 26, color: palette.surface, fontSize: 32, lineHeight: 37, fontWeight: '900' },
  subtitle: { marginTop: 10, maxWidth: 310, color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 21, fontWeight: '700' },
  statsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  stat: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  statText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  gridRow: { justifyContent: 'space-between' },
  empty: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: palette.muted, fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
