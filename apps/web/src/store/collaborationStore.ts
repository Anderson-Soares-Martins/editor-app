import { create } from 'zustand';
import type { CollaboratorCursor } from '@editor-app/shared';

interface CollaborationStore {
  isConnected: boolean;
  roomId: string | null;
  userId: string | null;
  userName: string;
  userColor: string;
  cursors: Record<string, CollaboratorCursor>;

  setConnected: (connected: boolean) => void;
  setRoom: (roomId: string | null) => void;
  setUser: (userId: string, name: string, color: string) => void;
  updateCursor: (cursor: CollaboratorCursor) => void;
  removeCursor: (userId: string) => void;
  clearCursors: () => void;
}

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  isConnected: false,
  roomId: null,
  userId: null,
  userName: 'Anonymous',
  userColor: getRandomColor(),
  cursors: {},

  setConnected: (connected) => set({ isConnected: connected }),

  setRoom: (roomId) => set({ roomId }),

  setUser: (userId, name, color) =>
    set({
      userId,
      userName: name,
      userColor: color,
    }),

  updateCursor: (cursor) =>
    set((state) => ({
      cursors: { ...state.cursors, [cursor.id]: cursor },
    })),

  removeCursor: (userId) =>
    set((state) => {
      const { [userId]: _, ...remainingCursors } = state.cursors;
      return { cursors: remainingCursors };
    }),

  clearCursors: () => set({ cursors: {} }),
}));
