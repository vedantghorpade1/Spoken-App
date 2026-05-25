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
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard, Pill, Screen, palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';

export default function SignupScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) {
      setError('Enter your name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ name: trimmedName, email: trimmedEmail, password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.topCard}>
              <View style={styles.logo}>
                <MaterialCommunityIcons name="star-four-points" size={24} color={palette.emeraldDeep} />
              </View>
              <View style={styles.previewCard}>
                <Text style={styles.previewScore}>AI Fluency</Text>
                <Text style={styles.previewValue}>+24%</Text>
              </View>
            </View>

            <Text style={styles.title}>Create your speaking identity</Text>
            <Text style={styles.subtitle}>Join rooms, match with partners, and get AI feedback after every voice session.</Text>

            <GlassCard style={styles.form}>
              <View style={styles.badges}>
                <Pill label="AI coach" icon="robot-happy" active />
                <Pill label="Voice rooms" icon="broadcast" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={palette.softText} style={styles.input} />
              </View>
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
              <Pressable onPress={handleSignup} disabled={isSubmitting} style={styles.cta}>
                <LinearGradient colors={['#10B981', '#8C5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>{isSubmitting ? 'Creating...' : 'Signup'}</Text>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </Pressable>
            </GlassCard>

            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.switchLink}>
              <Text style={styles.switchText}>Already have an account? <Text style={styles.switchStrong}>Login</Text></Text>
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
  topCard: { height: 116, marginBottom: 22 },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emeraldSoft,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
  },
  previewCard: {
    position: 'absolute',
    right: 0,
    top: 20,
    width: 154,
    height: 86,
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.stroke,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  previewScore: { color: palette.muted, fontSize: 12, fontWeight: '800' },
  previewValue: { marginTop: 7, color: palette.text, fontSize: 27, fontWeight: '900' },
  title: { color: palette.text, fontSize: 36, lineHeight: 40, fontWeight: '900' },
  subtitle: { marginTop: 10, color: palette.muted, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  form: { marginTop: 26, gap: 16, backgroundColor: 'rgba(255,255,255,0.92)' },
  badges: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
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
  switchLink: { marginTop: 22, alignItems: 'center' },
  switchText: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  switchStrong: { color: palette.emeraldDeep, fontWeight: '900' },
});
