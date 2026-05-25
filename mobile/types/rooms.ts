export type RoomType = 'open' | 'private' | 'friends' | 'scheduled';

export type RoomRole = 'host' | 'moderator' | 'speaker' | 'listener';

export type RoomCategory =
  | 'Casual Talk'
  | 'IELTS'
  | 'Debate'
  | 'Startup Talks'
  | 'Interview Prep'
  | 'Travel English'
  | 'Pronunciation'
  | 'Beginners'
  | 'Advanced Speakers';

export type RoomParticipant = {
  id: string;
  name: string;
  initials: string;
  role: RoomRole;
  level: string;
  muted: boolean;
  speaking: boolean;
  raisedHand?: boolean;
};

export type RoomMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  kind: 'message' | 'system' | 'ai';
  createdAt: string;
};

export type RoomReaction = {
  id: string;
  roomId: string;
  userId: string;
  emoji: string;
  createdAt: string;
};

export type LiveRoom = {
  id: string;
  title: string;
  topic: string;
  description: string;
  category: RoomCategory;
  level: string;
  type: RoomType;
  host: RoomParticipant;
  participants: RoomParticipant[];
  speakers: number;
  listeners: number;
  tags: string[];
  isLive: boolean;
  isFollowed?: boolean;
  channelName: string;
  agoraToken?: string | null;
  uid?: number;
  startedAt: string;
};

export type CreateRoomPayload = {
  name: string;
  topic: string;
  description: string;
  category: RoomCategory;
  level: string;
  tags: string[];
  image?: string;
  type: RoomType;
  maxParticipants: number;
  allowListeners: boolean;
  speakerApproval: boolean;
  recordingEnabled: boolean;
  aiModerationEnabled: boolean;
};

export type RoomAnalytics = {
  speakingTime: number;
  roomsJoined: number;
  roomsHosted: number;
  averageConfidence: number;
  speakingStreak: number;
};
