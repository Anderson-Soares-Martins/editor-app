import { create } from 'zustand';
import type { HistoryEntry } from '@editor-app/shared';
import { useCanvasStore } from './canvasStore';

const MAX_HISTORY_SIZE = 50;

let _skipNextRecord = false;

interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const canvas = useCanvasStore.getState();
    const currentEntry: HistoryEntry = {
      shapes: JSON.parse(JSON.stringify(canvas.shapes)),
      layers: JSON.parse(JSON.stringify(canvas.layers)),
      timestamp: Date.now(),
    };

    const past = [...state.past];
    const entry = past.pop()!;

    _skipNextRecord = true;
    canvas.setState({
      shapes: entry.shapes,
      layers: entry.layers,
    });

    set({
      past,
      future: [currentEntry, ...state.future],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const canvas = useCanvasStore.getState();
    const currentEntry: HistoryEntry = {
      shapes: JSON.parse(JSON.stringify(canvas.shapes)),
      layers: JSON.parse(JSON.stringify(canvas.layers)),
      timestamp: Date.now(),
    };

    const future = [...state.future];
    const entry = future.shift()!;

    _skipNextRecord = true;
    canvas.setState({
      shapes: entry.shapes,
      layers: entry.layers,
    });

    set({
      past: [...state.past, currentEntry],
      future,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => {
    set({ past: [], future: [] });
  },
}));

// Auto-record canvas state changes via Zustand subscribe (outside React lifecycle)
useCanvasStore.subscribe((state, prevState) => {
  if (_skipNextRecord) {
    _skipNextRecord = false;
    return;
  }

  if (state.shapes !== prevState.shapes || state.layers !== prevState.layers) {
    const entry: HistoryEntry = {
      shapes: JSON.parse(JSON.stringify(prevState.shapes)),
      layers: JSON.parse(JSON.stringify(prevState.layers)),
      timestamp: Date.now(),
    };

    const historyState = useHistoryStore.getState();
    const past = [...historyState.past, entry];
    if (past.length > MAX_HISTORY_SIZE) {
      past.shift();
    }

    useHistoryStore.setState({
      past,
      future: [],
    });
  }
});
