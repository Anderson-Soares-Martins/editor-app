import { create } from 'zustand';
import type { HistoryEntry, Shape, Layer } from '@editor-app/shared';

const MAX_HISTORY_SIZE = 50;

interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];
  isRecording: boolean;

  pushState: (shapes: Record<string, Shape>, layers: Layer[]) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  isRecording: true,

  pushState: (shapes, layers) => {
    if (!get().isRecording) return;

    const entry: HistoryEntry = {
      shapes: JSON.parse(JSON.stringify(shapes)),
      layers: JSON.parse(JSON.stringify(layers)),
      timestamp: Date.now(),
    };

    set((state) => {
      const past = [...state.past, entry];
      if (past.length > MAX_HISTORY_SIZE) {
        past.shift();
      }
      return {
        past,
        future: [],
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return null;

    const past = [...state.past];
    const entry = past.pop()!;

    set({ past });

    return entry;
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return null;

    const future = [...state.future];
    const entry = future.shift()!;

    set({ future });

    return entry;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => {
    set({ past: [], future: [] });
  },

  pauseRecording: () => {
    set({ isRecording: false });
  },

  resumeRecording: () => {
    set({ isRecording: true });
  },
}));
