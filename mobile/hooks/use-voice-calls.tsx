import { router } from 'expo-router';
import { Phone, PhoneOff, UserRound } from 'lucide-react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/components/premium-ui';
import { useAuth } from '@/hooks/use-auth';
import { voiceSocketService } from '@/services/socket';
import { voiceApi } from '@/services/voice-api';
import type { CallRoom } from '@/types/voice';

type VoiceCallsContextValue = {
  incomingCall: CallRoom | null;
  startFriendCall: (friendId: string) => Promise<CallRoom>;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  openCall: (call: CallRoom) => void;
};

const VoiceCallsContext = createContext<VoiceCallsContextValue | null>(null);

function callParams(call: CallRoom) {
  return {
    callId: call.callId,
    channelName: call.channelName,
    agoraToken: call.agoraToken ?? '',
    uid: String(call.uid),
    partnerLabel: call.partner.name,
    callType: call.callType,
  };
}

export function VoiceCallsProvider({ children }: PropsWithChildren) {
  const { token, isAuthenticated } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallRoom | null>(null);

  const openCall = useCallback((call: CallRoom) => {
    router.push({ pathname: '/match/call', params: callParams(call) });
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      voiceSocketService.disconnect();
      setIncomingCall(null);
      return;
    }

    voiceSocketService.connect(token, {
      onMatchmakingFound: openCall,
      onIncomingCall: setIncomingCall,
      onCallAccepted: openCall,
      onCallRejected: () => setIncomingCall(null),
      onCallEnded: () => undefined,
      onReconnect: () => undefined,
    });

    return () => voiceSocketService.disconnect();
  }, [isAuthenticated, openCall, token]);

  const startFriendCall = useCallback(async (friendId: string) => {
    return voiceApi.createCall(friendId);
  }, []);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return;
    }
    voiceSocketService.acceptCall(incomingCall.callId);
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return;
    }
    voiceSocketService.rejectCall(incomingCall.callId);
    setIncomingCall(null);
  }, [incomingCall]);

  const value = useMemo(
    () => ({ incomingCall, startFriendCall, acceptIncomingCall, rejectIncomingCall, openCall }),
    [acceptIncomingCall, incomingCall, openCall, rejectIncomingCall, startFriendCall],
  );

  return (
    <VoiceCallsContext.Provider value={value}>
      {children}
      <IncomingCallModal call={incomingCall} onAccept={acceptIncomingCall} onReject={rejectIncomingCall} />
    </VoiceCallsContext.Provider>
  );
}

export function useVoiceCalls() {
  const context = useContext(VoiceCallsContext);
  if (!context) {
    throw new Error('useVoiceCalls must be used inside VoiceCallsProvider');
  }
  return context;
}

function IncomingCallModal({
  call,
  onAccept,
  onReject,
}: {
  call: CallRoom | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Modal transparent visible={Boolean(call)} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.avatar}>
            <UserRound size={34} color={palette.surface} />
          </View>
          <Text style={styles.title}>Incoming voice call</Text>
          <Text style={styles.subtitle}>{call?.partner.name ?? 'Friend'} wants to practice now</Text>
          <View style={styles.actions}>
            <Pressable onPress={onReject} style={[styles.actionButton, styles.reject]}>
              <PhoneOff size={24} color={palette.surface} />
            </Pressable>
            <Pressable onPress={onAccept} style={[styles.actionButton, styles.accept]}>
              <Phone size={24} color={palette.surface} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15,23,42,0.42)',
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.blue,
  },
  title: { marginTop: 18, color: palette.text, fontSize: 22, fontWeight: '900' },
  subtitle: { marginTop: 7, color: palette.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  actions: { marginTop: 22, flexDirection: 'row', gap: 18 },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reject: { backgroundColor: '#EF4444' },
  accept: { backgroundColor: palette.emeraldDeep },
});
