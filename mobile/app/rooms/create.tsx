import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Lock, Mic2, ShieldCheck, Sparkles, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/premium-ui';
import { useRoomStore } from '@/stores/rooms';
import type { CreateRoomPayload, RoomCategory, RoomType } from '@/types/rooms';

const categories: RoomCategory[] = ['Casual Talk', 'IELTS', 'Debate', 'Startup Talks', 'Interview Prep', 'Travel English', 'Pronunciation', 'Beginners', 'Advanced Speakers'];
const levels = ['A2', 'B1', 'B2', 'C1', 'Mixed'];
const roomTypes: Array<{ value: RoomType; label: string; icon: typeof Mic2 }> = [
  { value: 'open', label: 'Open Room', icon: Mic2 },
  { value: 'private', label: 'Private Room', icon: Lock },
  { value: 'friends', label: 'Friends Only', icon: Users },
  { value: 'scheduled', label: 'Scheduled Room', icon: ShieldCheck },
];

export default function CreateRoomScreen() {
  const createRoom = useRoomStore((state) => state.createRoom);
  const [name, setName] = useState('Evening fluency circle');
  const [topic, setTopic] = useState('Speak naturally about daily work and travel');
  const [description, setDescription] = useState('A friendly room for English learners who want confident, natural conversation.');
  const [category, setCategory] = useState<RoomCategory>('Casual Talk');
  const [level, setLevel] = useState('B2');
  const [tags, setTags] = useState('fluency, confidence, daily english');
  const [type, setType] = useState<RoomType>('open');
  const [maxParticipants, setMaxParticipants] = useState('24');
  const [allowListeners, setAllowListeners] = useState(true);
  const [speakerApproval, setSpeakerApproval] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [aiModerationEnabled, setAiModerationEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const payload: CreateRoomPayload = useMemo(
    () => ({
      name: name.trim(),
      topic: topic.trim(),
      description: description.trim(),
      category,
      level,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      type,
      maxParticipants: Number(maxParticipants) || 24,
      allowListeners,
      speakerApproval,
      recordingEnabled,
      aiModerationEnabled,
    }),
    [aiModerationEnabled, allowListeners, category, description, level, maxParticipants, name, recordingEnabled, speakerApproval, tags, topic, type],
  );

  async function handleCreate() {
    if (!payload.name || !payload.topic) {
      Alert.alert('Room needs a name and topic');
      return;
    }

    try {
      setSubmitting(true);
      const room = await createRoom(payload);
      router.replace({ pathname: '/rooms/[id]', params: { id: room.id } } as never);
    } catch (error) {
      Alert.alert('Could not create room', error instanceof Error ? error.message : 'Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['rgba(7,149,106,0.18)', 'rgba(255,255,255,0)', 'rgba(20,201,135,0.1)']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={22} color={palette.text} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>Start a live room</Text>
              <Text style={styles.title}>Create Voice Room</Text>
            </View>
          </View>

          <LinearGradient colors={['rgba(7,149,106,0.94)', 'rgba(20,201,135,0.82)']} style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Sparkles size={24} color={palette.emeraldDeep} />
            </View>
            <Text style={styles.previewTitle}>{name || 'Room name'}</Text>
            <Text style={styles.previewTopic}>{topic || 'Room topic'}</Text>
          </LinearGradient>

          <Panel title="Room details">
            <Field label="Room name" value={name} onChangeText={setName} />
            <Field label="Topic" value={topic} onChangeText={setTopic} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            <Field label="Tags" value={tags} onChangeText={setTags} />
          </Panel>

          <Panel title="Category">
            <View style={styles.wrap}>
              {categories.map((item) => <Choice key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}
            </View>
          </Panel>

          <Panel title="Language level">
            <View style={styles.segmentRow}>
              {levels.map((item) => <Choice key={item} label={item} active={level === item} onPress={() => setLevel(item)} compact />)}
            </View>
          </Panel>

          <Panel title="Room type">
            <View style={styles.typeGrid}>
              {roomTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <Pressable key={item.value} onPress={() => setType(item.value)} style={[styles.typeCard, type === item.value && styles.typeCardActive]}>
                    <Icon size={20} color={type === item.value ? palette.surface : palette.emeraldDeep} />
                    <Text style={[styles.typeText, type === item.value && styles.typeTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Panel>

          <Panel title="Host settings">
            <Field label="Max participants" value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="number-pad" />
            <SettingRow label="Allow listeners" value={allowListeners} onValueChange={setAllowListeners} />
            <SettingRow label="Speaker approval" value={speakerApproval} onValueChange={setSpeakerApproval} />
            <SettingRow label="Recording enabled" value={recordingEnabled} onValueChange={setRecordingEnabled} />
            <SettingRow label="AI moderation" value={aiModerationEnabled} onValueChange={setAiModerationEnabled} />
          </Panel>

          <Pressable onPress={handleCreate} disabled={submitting} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}>
            <Mic2 size={20} color={palette.surface} />
            <Text style={styles.submitText}>{submitting ? 'Creating room...' : 'Create live room'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={palette.softText} style={[styles.input, props.multiline && styles.textArea]} {...props} />
    </View>
  );
}

function Choice({ label, active, onPress, compact }: { label: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, compact && styles.choiceCompact, active && styles.choiceActive]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: 'rgba(20,201,135,0.35)', false: 'rgba(15,23,42,0.1)' }} thumbColor={value ? palette.emeraldDeep : palette.surface} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  content: { padding: 18, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(15,23,42,0.07)' },
  headerCopy: { flex: 1 },
  kicker: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  title: { marginTop: 2, color: palette.text, fontSize: 27, lineHeight: 31, fontWeight: '900' },
  previewCard: { marginTop: 18, minHeight: 164, borderRadius: 32, padding: 20, justifyContent: 'flex-end', shadowColor: 'rgba(7,149,106,0.24)', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 1, shadowRadius: 30, elevation: 12 },
  previewIcon: { width: 50, height: 50, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)' },
  previewTitle: { marginTop: 18, color: palette.surface, fontSize: 25, lineHeight: 30, fontWeight: '900' },
  previewTopic: { marginTop: 6, color: 'rgba(255,255,255,0.84)', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  panel: { marginTop: 16, borderRadius: 28, padding: 16, gap: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.09)' },
  panelTitle: { color: palette.text, fontSize: 17, fontWeight: '900' },
  field: { gap: 7 },
  fieldLabel: { color: palette.muted, fontSize: 11, fontWeight: '900' },
  input: { minHeight: 48, borderRadius: 18, paddingHorizontal: 14, color: palette.text, fontSize: 14, fontWeight: '800', backgroundColor: 'rgba(248,250,252,0.92)', borderWidth: 1, borderColor: 'rgba(15,23,42,0.07)' },
  textArea: { minHeight: 92, paddingTop: 13, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 38, borderRadius: 19, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,201,135,0.08)' },
  choiceCompact: { minWidth: 54 },
  choiceActive: { backgroundColor: palette.emeraldDeep },
  choiceText: { color: palette.emeraldDeep, fontSize: 12, fontWeight: '900' },
  choiceTextActive: { color: palette.surface },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '48%', minHeight: 86, borderRadius: 22, padding: 13, justifyContent: 'space-between', backgroundColor: 'rgba(20,201,135,0.08)', borderWidth: 1, borderColor: 'rgba(7,149,106,0.08)' },
  typeCardActive: { backgroundColor: palette.emeraldDeep },
  typeText: { color: palette.emeraldDeep, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  typeTextActive: { color: palette.surface },
  settingRow: { minHeight: 48, borderRadius: 18, paddingLeft: 13, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(248,250,252,0.88)' },
  settingLabel: { color: palette.text, fontSize: 13, fontWeight: '900' },
  submitButton: { marginTop: 18, minHeight: 58, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.emeraldDeep },
  submitButtonDisabled: { opacity: 0.64 },
  submitText: { color: palette.surface, fontSize: 15, fontWeight: '900' },
});
