import { create } from 'zustand';

import { roomApi, type JoinRoomResponse, type PredefinedRoom, type RoomParticipant } from '@/services/room-api';

type RoomState = {
  rooms: PredefinedRoom[];
  activeRoom: PredefinedRoom | null;
  participants: RoomParticipant[];
  joiningRoomId: string | null;
  loading: boolean;
  error: string | null;
  loadRooms: () => Promise<void>;
  joinRoom: (roomId: string, userId: string) => Promise<JoinRoomResponse>;
  setActiveSession: (session: JoinRoomResponse) => void;
  setParticipants: (participants: RoomParticipant[]) => void;
  setParticipantSpeaking: (userId: string | null) => void;
  clearActiveRoom: () => void;
};

export const usePredefinedRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  participants: [],
  joiningRoomId: null,
  loading: false,
  error: null,
  loadRooms: async () => {
    set({ loading: true, error: null });
    try {
      const rooms = await roomApi.list();
      set({ rooms });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to load rooms.' });
    } finally {
      set({ loading: false });
    }
  },
  joinRoom: async (roomId, userId) => {
    set({ joiningRoomId: roomId, error: null });
    try {
      const session = await roomApi.join(roomId, userId);
      set({
        activeRoom: session.room,
        participants: session.participants,
      });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join room.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ joiningRoomId: null });
    }
  },
  setActiveSession: (session) => set({ activeRoom: session.room, participants: session.participants }),
  setParticipants: (participants) => set({ participants }),
  setParticipantSpeaking: (userId) =>
    set((state) => ({
      participants: state.participants.map((participant) => ({
        ...participant,
        speaking: Boolean(userId) && participant.id === userId,
      })),
    })),
  clearActiveRoom: () => set({ activeRoom: null, participants: [] }),
}));
