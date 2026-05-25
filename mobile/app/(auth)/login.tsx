import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, Screen, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <MaterialCommunityIcons name="microphone-variant" size={24} color={palette.emeraldDeep} />
              </View>
              <Text style={styles.brand}>SpeakAI</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Continue building fluent spoken English with AI and real people.</Text>

            <GlassCard style={styles.form}>
              <Svg width="100%" height={62} style={styles.wave}>
                <Path
                  d="M0 36 C32 8 62 8 92 36 S152 64 184 36 S244 8 278 36 S340 64 375 36"
                  stroke="rgba(16,185,129,0.18)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@speakai.app"
                  placeholderTextColor={palette.softText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={palette.softText}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable onPress={handleLogin} disabled={isSubmitting} style={styles.cta}>
                <LinearGradient colors={['#10B981', '#4D7CFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>{isSubmitting ? 'Signing in...' : 'Login'}</Text>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.socialRow}>
                <Pressable style={styles.socialButton}>
                  <MaterialCommunityIcons name="google" size={20} color={palette.text} />
                </Pressable>
                <Pressable style={styles.socialButton}>
                  <MaterialCommunityIcons name="apple" size={22} color={palette.text} />
                </Pressable>
              </View>
            </GlassCard>

            <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.switchLink}>
              <Text style={styles.switchText}>New to SpeakAI? <Text style={styles.switchStrong}>Create account</Text></Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 22, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
  },
  brand: { color: palette.text, fontSize: 20, fontWeight: '900' },
  title: { color: palette.text, fontSize: 38, lineHeight: 42, fontWeight: '900' },
  subtitle: { marginTop: 10, color: palette.muted, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  form: { marginTop: 28, gap: 16, backgroundColor: 'rgba(255,255,255,0.92)' },
  wave: { position: 'absolute', top: 12, left: 18, right: 18 },
  inputGroup: { gap: 8 },
  label: { color: palette.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: palette.text,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: palette.stroke,
    fontSize: 15,
    fontWeight: '600',
  },
  error: { color: '#D92D20', fontSize: 13, fontWeight: '700' },
  cta: { marginTop: 4, borderRadius: 22, overflow: 'hidden' },
  ctaGradient: {
    height: 58,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  switchLink: { marginTop: 22, alignItems: 'center' },
  switchText: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  switchStrong: { color: palette.emeraldDeep, fontWeight: '900' },
});
