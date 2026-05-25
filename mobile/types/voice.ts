export type CallPartner = {
  id: string;
  name: string;
  email: string;
};

export type CallRoom = {
  callId: string;
  channelName: string;
  agoraToken: string | null;
  uid: number;
  partner: CallPartner;
  callType: 'random' | 'friend' | string;
  status: 'ringing' | 'active' | 'ended' | 'rejected' | string;
};

export type MatchmakingResult = {
  status: 'idle' | 'waiting' | 'matched' | 'active' | 'ringing' | string;
  call: CallRoom | null;
};

export type CallHistoryItem = {
  id: string;
  caller_id: string;
  receiver_id: string;
  duration: number;
  timestamp: string;
  call_type: string;
  status: string;
  partner: CallPartner;
};

export type ProgressSummary = {
  stars: number;
  streak_count: number;
  weekly_duration: number;
  last_speaking_date: string | null;
};
