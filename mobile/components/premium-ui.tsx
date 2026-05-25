import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export const palette = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  panel: 'rgba(255,255,255,0.82)',
  panelStrong: 'rgba(255,255,255,0.96)',
  stroke: 'rgba(15,23,42,0.08)',
  text: '#0A0F1C',
  muted: '#667085',
  softText: '#98A2B3',
  emerald: '#14C987',
  emeraldDeep: '#07956A',
  emeraldSoft: 'rgba(20,201,135,0.12)',
  blue: '#4D7CFE',
  purple: '#8C5CFF',
  pink: '#F15BB5',
  warning: '#F8B84E',
  shadow: 'rgba(15,23,42,0.11)',
};

export type PremiumIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Screen({ children }: PropsWithChildren) {
  return (
    <View style={styles.screen}>
      <View style={[styles.glow, styles.glowEmerald]} />
      <View style={[styles.glow, styles.glowPurple]} />
      <View style={[styles.glassWash, styles.glassWashTop]} />
      <View style={[styles.glassWash, styles.glassWashBottom]} />
      {children}
    </View>
  );
}

export function GlassCard({
  children,
  style,
}: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PressableCard({
  children,
  style,
}: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
}>) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}>
      <Animated.View style={[styles.card, style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function Pill({
  label,
  icon,
  active,
}: {
  label: string;
  icon?: PremiumIconName;
  active?: boolean;
}) {
  return (
    <View style={[styles.pill, active && styles.pillActive]}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={15}
          color={active ? palette.surface : palette.emeraldDeep}
        />
      ) : null}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </View>
  );
}

export function IconButton({
  icon,
  active,
  label,
}: {
  icon: PremiumIconName;
  active?: boolean;
  label?: string;
}) {
  return (
    <Pressable style={[styles.iconButton, active && styles.iconButtonActive]}>
      <MaterialCommunityIcons name={icon} size={22} color={active ? palette.surface : palette.text} />
      {label ? <Text style={[styles.iconLabel, active && styles.iconLabelActive]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Avatar({
  initials,
  size = 50,
  active,
  color = palette.blue,
}: {
  initials: string;
  size?: number;
  active?: boolean;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        active && styles.avatarActive,
      ]}>
      <Text style={[styles.avatarText, { fontSize: Math.max(12, size * 0.32) }]}>{initials}</Text>
    </View>
  );
}

export function Waveform({ bars = 18, color = palette.emerald }: { bars?: number; color?: string }) {
  return (
    <View style={styles.wave}>
      {Array.from({ length: bars }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.waveBar,
            {
              height: 8 + ((index * 13) % 28),
              backgroundColor: color,
              opacity: 0.35 + ((index % 4) * 0.14),
            },
          ]}
        />
      ))}
    </View>
  );
}

export function Metric({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, accent ? { color: accent } : undefined]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.52,
  },
  glowEmerald: {
    top: -120,
    right: -118,
    backgroundColor: 'rgba(20,201,135,0.25)',
  },
  glowPurple: {
    bottom: 95,
    left: -140,
    backgroundColor: 'rgba(140,92,255,0.16)',
  },
  glassWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 180,
  },
  glassWashTop: {
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  glassWashBottom: {
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  card: {
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panel,
    borderRadius: 30,
    padding: 18,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 10,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionAction: {
    color: palette.emeraldDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  pill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
  },
  pillActive: {
    borderColor: 'rgba(20,201,135,0.2)',
    backgroundColor: palette.emeraldDeep,
  },
  pillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextActive: {
    color: palette.surface,
  },
  iconButton: {
    minWidth: 58,
    height: 58,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: palette.panelStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  iconButtonActive: {
    borderColor: palette.emeraldDeep,
    backgroundColor: palette.emeraldDeep,
  },
  iconLabel: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  iconLabelActive: {
    color: palette.surface,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
  },
  avatarActive: {
    borderColor: palette.surface,
    shadowColor: palette.emerald,
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  avatarText: {
    color: palette.text,
    fontWeight: '900',
  },
  wave: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 4,
  },
  metric: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: 14,
  },
  metricValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 4,
    color: palette.muted,
    fontSize: 11,
    fontWeight: '700',
  },
});
