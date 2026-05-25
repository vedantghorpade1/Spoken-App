import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, PhoneOff, RefreshCw, Volume2, VolumeX } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/premium-ui';

type CallControlsProps = {
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onLeave: () => void;
  onRematch: () => void;
};

export function CallControls({
  muted,
  speakerOn,
  onToggleMute,
  onToggleSpeaker,
  onLeave,
  onRematch,
}: CallControlsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.primaryRow}>
        <ControlButton
          label={muted ? 'Unmute' : 'Mute'}
          active={muted}
          onPress={onToggleMute}
          icon={muted ? <MicOff size={23} color={muted ? palette.surface : palette.text} /> : <Mic size={23} color={palette.text} />}
        />
        <Pressable onPress={onLeave} style={styles.endButton}>
          <PhoneOff size={28} color={palette.surface} />
        </Pressable>
        <ControlButton
          label={speakerOn ? 'Speaker' : 'Earpiece'}
          active={speakerOn}
          onPress={onToggleSpeaker}
          icon={speakerOn ? <Volume2 size={23} color={speakerOn ? palette.surface : palette.text} /> : <VolumeX size={23} color={palette.text} />}
        />
      </View>

      <Pressable onPress={onRematch}>
        <LinearGradient colors={['#07956A', '#4D7CFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rematch}>
          <RefreshCw size={18} color={palette.surface} />
          <Text style={styles.rematchText}>Next Partner</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function ControlButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.control, active && styles.controlActive]}>
      {icon}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  control: {
    width: 88,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  controlActive: {
    backgroundColor: palette.emeraldDeep,
  },
  label: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '900',
  },
  labelActive: {
    color: palette.surface,
  },
  endButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 12,
  },
  rematch: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  rematchText: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: '900',
  },
});
