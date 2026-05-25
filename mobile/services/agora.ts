import { PermissionsAndroid, Platform } from 'react-native';
import {
  AudioProfileType,
  AudioScenarioType,
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  createAgoraRtcEngine,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from 'react-native-agora';

import { env, requireEnv } from '@/constants/env';

export type AgoraCallState =
  | 'idle'
  | 'initializing'
  | 'joining'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type AgoraVoiceEvent = {
  state?: AgoraCallState;
  remoteUsers?: number[];
  isLocalSpeaking?: boolean;
  isRemoteSpeaking?: boolean;
  error?: string | null;
};

export type AgoraVoiceListener = (event: AgoraVoiceEvent) => void;

class AgoraVoiceService {
  private engine: IRtcEngine | null = null;
  private handler: IRtcEngineEventHandler | null = null;
  private listeners = new Set<AgoraVoiceListener>();
  private remoteUsers = new Set<number>();
  private initialized = false;
  private joined = false;
  private muted = false;
  private speakerOn = true;

  subscribe(listener: AgoraVoiceListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async initialize() {
    if (this.initialized && this.engine) {
      return;
    }

    this.emit({ state: 'initializing', error: null });
    await this.requestMicrophonePermission();

    const appId = requireEnv(env.agoraAppId, 'EXPO_PUBLIC_AGORA_APP_ID');
    const engine = createAgoraRtcEngine();
    const initResult = engine.initialize({
      appId,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      audioScenario: AudioScenarioType.AudioScenarioChatroom,
    });

    if (initResult < 0) {
      throw new Error(`Agora initialization failed (${initResult}).`);
    }

    engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
    engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    engine.enableAudio();
    engine.setAudioProfile(AudioProfileType.AudioProfileSpeechStandard, AudioScenarioType.AudioScenarioChatroom);
    engine.setDefaultAudioRouteToSpeakerphone(true);
    engine.setEnableSpeakerphone(true);
    engine.enableAudioVolumeIndication(350, 3, true);

    this.handler = this.createHandler();
    engine.registerEventHandler(this.handler);
    this.engine = engine;
    this.initialized = true;
    this.speakerOn = true;
    this.emit({ state: 'idle', error: null });
  }

  async joinChannel(channelName: string, token = '', uid = 0) {
    await this.initialize();

    if (!this.engine) {
      throw new Error('Agora engine is not available.');
    }

    if (this.joined) {
      this.engine.leaveChannel();
      this.joined = false;
      this.remoteUsers.clear();
    }

    this.emit({ state: 'joining', remoteUsers: [] });

    const result = this.engine.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
    });

    if (result < 0) {
      throw new Error(`Agora join failed (${result}).`);
    }
  }

  muteLocalAudio(muted: boolean) {
    if (!this.engine) {
      return;
    }

    this.engine.muteLocalAudioStream(muted);
    this.muted = muted;
  }

  toggleMute() {
    const nextMuted = !this.muted;
    this.muteLocalAudio(nextMuted);
    return nextMuted;
  }

  setSpeaker(enabled: boolean) {
    if (!this.engine) {
      return;
    }

    this.engine.setEnableSpeakerphone(enabled);
    this.speakerOn = enabled;
  }

  toggleSpeaker() {
    const nextSpeaker = !this.speakerOn;
    this.setSpeaker(nextSpeaker);
    return nextSpeaker;
  }

  async leaveChannel() {
    if (!this.engine || !this.joined) {
      this.remoteUsers.clear();
      this.emit({ state: 'disconnected', remoteUsers: [] });
      return;
    }

    this.engine.leaveChannel();
    this.joined = false;
    this.remoteUsers.clear();
    this.emit({ state: 'disconnected', remoteUsers: [] });
  }

  destroy() {
    if (!this.engine) {
      return;
    }

    if (this.handler) {
      this.engine.unregisterEventHandler(this.handler);
    }

    if (this.joined) {
      this.engine.leaveChannel();
    }

    this.engine.release();
    this.engine = null;
    this.handler = null;
    this.initialized = false;
    this.joined = false;
    this.remoteUsers.clear();
    this.emit({ state: 'idle', remoteUsers: [] });
  }

  private createHandler(): IRtcEngineEventHandler {
    return {
      onJoinChannelSuccess: () => {
        this.joined = true;
        this.emit({ state: 'connected', remoteUsers: Array.from(this.remoteUsers), error: null });
      },
      onUserJoined: (_connection, remoteUid) => {
        this.remoteUsers.add(remoteUid);
        this.emit({ state: 'connected', remoteUsers: Array.from(this.remoteUsers) });
      },
      onUserOffline: (_connection, remoteUid) => {
        this.remoteUsers.delete(remoteUid);
        this.emit({ state: this.joined ? 'connected' : 'disconnected', remoteUsers: Array.from(this.remoteUsers) });
      },
      onLeaveChannel: () => {
        this.joined = false;
        this.remoteUsers.clear();
        this.emit({ state: 'disconnected', remoteUsers: [] });
      },
      onConnectionStateChanged: (_connection, state) => {
        if (state === ConnectionStateType.ConnectionStateReconnecting) {
          this.emit({ state: 'reconnecting' });
        }

        if (state === ConnectionStateType.ConnectionStateConnected) {
          this.emit({ state: 'connected', remoteUsers: Array.from(this.remoteUsers), error: null });
        }

        if (state === ConnectionStateType.ConnectionStateFailed) {
          this.emit({ state: 'failed', error: 'Connection failed. Leave and try another partner.' });
        }
      },
      onAudioVolumeIndication: (_connection, speakers, _speakerNumber, totalVolume) => {
        const isLocalSpeaking = speakers.some((speaker) => speaker.uid === 0 && (speaker.volume ?? 0) > 18);
        const isRemoteSpeaking = speakers.some((speaker) => speaker.uid !== 0 && (speaker.volume ?? 0) > 18) || totalVolume > 48;
        this.emit({ isLocalSpeaking, isRemoteSpeaking });
      },
      onPermissionError: () => {
        this.emit({ state: 'failed', error: 'Microphone permission is required for voice calls.' });
      },
      onError: (err, message) => {
        this.emit({ state: 'failed', error: message || `Agora error ${err}` });
      },
    };
  }

  private emit(event: AgoraVoiceEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private async requestMicrophonePermission() {
    if (Platform.OS !== 'android') {
      return;
    }

    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    const alreadyGranted = await PermissionsAndroid.check(permission);

    if (alreadyGranted) {
      return;
    }

    const result = await PermissionsAndroid.request(permission, {
      title: 'Microphone access',
      message: 'SpeakAI needs your microphone for live voice practice.',
      buttonPositive: 'Allow',
    });

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Microphone permission denied.');
    }
  }
}

export const agoraVoiceService = new AgoraVoiceService();
