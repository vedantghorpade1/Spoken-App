import { create } from 'zustand';

import { roomsApi } from '@/services/rooms-api';
import type { CreateRoomPayload, LiveRoom, RoomMessage, RoomReaction } from '@/types/rooms';

type RoomStore = {
  rooms: LiveRoom[];
  selectedCategory: string;
  loading: boolean;
  setSelectedCategory: (category: string) => void;
  loadRooms: () => Promise<void>;
  createRoom: (payload: CreateRoomPayload) => Promise<LiveRoom>;
};

type LiveRoomStore = {
  activeRoom: LiveRoom | null;
  elapsed: number;
  setActiveRoom: (room: LiveRoom | null) => void;
  updateParticipants: (participants: LiveRoom['participants']) => void;
  setElapsed: (elapsed: number) => void;
};

type AudioStore = {
  muted: boolean;
  speakerOn: boolean;
  localSpeaking: boolean;
  remoteSpeaking: boolean;
  setMuted: (muted: boolean) => void;
  setSpeakerOn: (speakerOn: boolean) => void;
  setSpeaking: (localSpeaking: boolean, remoteSpeaking: boolean) => void;
};

type ReactionsStore = {
  reactions: RoomReaction[];
  pushReaction: (reaction: RoomReaction) => void;
  clearOldReactions: () => void;
};

type RoomChatStore = {
  messages: RoomMessage[];
  addMessage: (message: RoomMessage) => void;
  clearMessages: () => void;
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  selectedCategory: 'All',
  loading: false,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  loadRooms: async () => {
    set({ loading: true });
    try {
      const rooms = await roomsApi.live(get().selectedCategory);
      set({ rooms });
    } finally {
      set({ loading: false });
    }
  },
  createRoom: async (payload) => {
    const room = await roomsApi.create(payload);
    set((state) => ({ rooms: [room, ...state.rooms] }));
    return room;
  },
}));

export const useLiveRoomStore = create<LiveRoomStore>((set) => ({
  activeRoom: null,
  elapsed: 0,
  setActiveRoom: (room) => set({ activeRoom: room, elapsed: 0 }),
  updateParticipants: (participants) =>
    set((state) => ({
      activeRoom: state.activeRoom ? { ...state.activeRoom, participants } : state.activeRoom,
    })),
  setElapsed: (elapsed) => set({ elapsed }),
}));

export const useAudioStore = create<AudioStore>((set) => ({
  muted: false,
  speakerOn: true,
  localSpeaking: false,
  remoteSpeaking: false,
  setMuted: (muted) => set({ muted }),
  setSpeakerOn: (speakerOn) => set({ speakerOn }),
  setSpeaking: (localSpeaking, remoteSpeaking) => set({ localSpeaking, remoteSpeaking }),
}));

export const useReactionsStore = create<ReactionsStore>((set) => ({
  reactions: [],
  pushReaction: (reaction) => set((state) => ({ reactions: [...state.reactions.slice(-12), reaction] })),
  clearOldReactions: () => set({ reactions: [] }),
}));

export const useRoomChatStore = create<RoomChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages.slice(-80), message] })),
  clearMessages: () => set({ messages: [] }),
}));
