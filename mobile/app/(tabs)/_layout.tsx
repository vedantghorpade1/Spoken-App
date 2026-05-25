import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { House, LineChart, Mic2, Radar, Settings, UserRound } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { palette } from '@/components/premium-ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.emeraldDeep,
        tabBarInactiveTintColor: '#98A2B3',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <IconWrap focused={focused}><House size={22} color={color} /></IconWrap>,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, focused }) => <IconWrap focused={focused}><Radar size={22} color={color} /></IconWrap>,
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, focused }) => <RoomsTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => <IconWrap focused={focused}><LineChart size={22} color={color} /></IconWrap>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <IconWrap focused={focused}><UserRound size={22} color={color} /></IconWrap>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <IconWrap focused={focused}><Settings size={22} color={color} /></IconWrap>,
        }}
      />
    </Tabs>
  );
}

function RoomsTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: focused ? 0.22 + pulse.value * 0.22 : 0,
    transform: [{ scale: 0.85 + pulse.value * 0.35 }],
  }));

  return (
    <IconWrap focused={focused}>
      <Animated.View style={[styles.roomsPulse, pulseStyle]} />
      <Mic2 size={22} color={color} />
    </IconWrap>
  );
}

function IconWrap({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(focused ? -2 : 0, { damping: 16, stiffness: 260 }) }],
  }));

  return <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 74,
    borderRadius: 30,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: 'rgba(7,149,106,0.1)',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingTop: 9,
    paddingBottom: 12,
    shadowColor: 'rgba(7,149,106,0.16)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 18,
  },
  tabItem: { borderRadius: 22 },
  label: { fontSize: 10.5, fontWeight: '900', marginTop: 2 },
  iconWrap: {
    width: 42,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(20,201,135,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(7,149,106,0.12)',
  },
  roomsPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.emeraldDeep,
  },
});
