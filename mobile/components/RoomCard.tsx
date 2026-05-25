import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { palette, type PremiumIconName } from '@/components/premium-ui';
import type { PredefinedRoom } from '@/services/room-api';

type RoomCardProps = {
  room: PredefinedRoom;
  joining?: boolean;
  onJoin: () => void;
};

export function RoomCard({ room, joining, onJoin }: RoomCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={joining}
      onPress={onJoin}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 240 });
      }}
      style={styles.pressable}>
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <LinearGradient colors={['rgba(255,255,255,0.98)', 'rgba(236,253,245,0.9)', 'rgba(255,255,255,0.92)']} style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={room.icon as PremiumIconName} size={28} color={palette.emeraldDeep} />
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{room.name}</Text>
            <Text style={styles.subtitle}>{room.description}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.countPill}>
              <MaterialCommunityIcons name="account-voice" size={15} color={palette.emeraldDeep} />
              <Text style={styles.countText}>{room.participants} active</Text>
            </View>
            <View style={styles.joinButton}>
              {joining ? (
                <ActivityIndicator size="small" color={palette.surface} />
              ) : (
                <>
                  <Text style={styles.joinText}>Join</Text>
                  <MaterialCommunityIcons name="arrow-right" size={17} color={palette.surface} />
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '47%',
    marginBottom: 16,
  },
  shadow: {
    minHeight: 190,
    borderRadius: 24,
    shadowColor: 'rgba(7,149,106,0.18)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 10,
  },
  card: {
    minHeight: 190,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(7,149,106,0.1)',
    justifyContent: 'space-between',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  liveBadge: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,201,135,0.12)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.emeraldDeep },
  liveText: { color: palette.emeraldDeep, fontSize: 10, fontWeight: '900' },
  copy: { alignItems: 'center', gap: 7, paddingVertical: 12 },
  title: { color: palette.text, fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  footer: { gap: 10 },
  countPill: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  countText: { color: palette.text, fontSize: 11, fontWeight: '900' },
  joinButton: {
    minHeight: 42,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: palette.emeraldDeep,
  },
  joinText: { color: palette.surface, fontSize: 13, fontWeight: '900' },
});
