import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react-native';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/premium-ui';

type VoiceControlsProps = {
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onLeave: () => void;
};

export function VoiceControls({ muted, speakerOn, onToggleMute, onToggleSpeaker, onLeave }: VoiceControlsProps) {
  return (
    <View style={styles.controls}>
      <ControlButton label={muted ? 'Unmute' : 'Mute'} active={!muted} danger={false} onPress={onToggleMute}>
        {muted ? <MicOff size={22} color={palette.text} /> : <Mic size={22} color={palette.surface} />}
      </ControlButton>
      <ControlButton label={speakerOn ? 'Speaker' : 'Earpiece'} active={speakerOn} danger={false} onPress={onToggleSpeaker}>
        {speakerOn ? <Volume2 size={22} color={palette.surface} /> : <VolumeX size={22} color={palette.text} />}
      </ControlButton>
      <ControlButton label="Leave" active danger onPress={onLeave}>
        <PhoneOff size={22} color={palette.surface} />
      </ControlButton>
    </View>
  );
}

function ControlButton({ children, label, active, danger, onPress }: { children: React.ReactNode; label: string; active: boolean; danger: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.controlWrap}>
      <View style={[styles.control, active && styles.controlActive, danger && styles.controlDanger]}>{children}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: {
    minHeight: 106,
    borderRadius: 30,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: palette.stroke,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 12,
  },
  controlWrap: { flex: 1, alignItems: 'center', gap: 8 },
  control: {
    width: 58,
    height: 58,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  controlActive: { backgroundColor: palette.emeraldDeep },
  controlDanger: { backgroundColor: '#D92D20' },
  label: { color: palette.muted, fontSize: 12, fontWeight: '900' },
});
