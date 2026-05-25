import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/components/premium-ui';
import type { RoomParticipant } from '@/services/room-api';

export function ParticipantBubble({ participant, local }: { participant: RoomParticipant; local?: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (participant.speaking) {
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 620 }), withTiming(0, { duration: 620 })), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 180 });
    }
  }, [participant.speaking, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: participant.speaking ? 0.22 + pulse.value * 0.3 : 0,
    transform: [{ scale: 1 + pulse.value * 0.22 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={[styles.avatar, local && styles.localAvatar]}>
          <Text style={styles.initials}>{participant.initials}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>{local ? 'You' : participant.name}</Text>
      <Text style={[styles.status, participant.muted && styles.muted]}>{participant.muted ? 'Muted' : participant.speaking ? 'Speaking' : 'Listening'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '31%', alignItems: 'center', gap: 7, marginBottom: 18 },
  avatarWrap: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: palette.emeraldDeep },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.purple,
    borderWidth: 3,
    borderColor: palette.surface,
  },
  localAvatar: { backgroundColor: palette.emeraldDeep },
  initials: { color: palette.surface, fontSize: 19, fontWeight: '900' },
  name: { maxWidth: '100%', color: palette.text, fontSize: 13, fontWeight: '900' },
  status: { color: palette.emeraldDeep, fontSize: 11, fontWeight: '800' },
  muted: { color: palette.softText },
});
