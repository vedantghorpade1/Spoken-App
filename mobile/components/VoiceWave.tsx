import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/components/premium-ui';

type VoiceWaveProps = {
  active?: boolean;
  compact?: boolean;
  color?: string;
};

export const VoiceWave = memo(function VoiceWave({ active = true, compact = false, color = palette.emeraldDeep }: VoiceWaveProps) {
  const bars = compact ? 18 : 24;

  return (
    <View style={styles.wave}>
      {Array.from({ length: bars }).map((_, index) => {
        const height = active ? 14 + ((index * 17) % 42) : 12 + ((index * 7) % 16);
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: color,
                opacity: active ? 0.35 + ((index % 5) * 0.12) : 0.2,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 56,
  },
  bar: {
    width: 5,
    borderRadius: 999,
  },
});
