import { create } from 'zustand';

interface SelectionStore {
  selectedIds: string[];
  isSelecting: boolean;
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;

  select: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  selectAll: (allIds: string[]) => void;
  deselect: (id: string) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  isSelected: (id: string) => boolean;

  startSelectionBox: (x: number, y: number) => void;
  updateSelectionBox: (x: number, y: number) => void;
  endSelectionBox: () => { x: number; y: number; width: number; height: number } | null;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedIds: [],
  isSelecting: false,
  selectionBox: null,

  select: (id, addToSelection = false) => {
    set((state) => {
      if (addToSelection) {
        if (state.selectedIds.includes(id)) {
          return state;
        }
        return { selectedIds: [...state.selectedIds, id] };
      }
      return { selectedIds: [id] };
    });
  },

  selectMultiple: (ids) => {
    set({ selectedIds: ids });
  },

  selectAll: (allIds) => {
    set({ selectedIds: allIds });
  },

  deselect: (id) => {
    set((state) => ({
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    }));
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  toggleSelection: (id) => {
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return {
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        };
      }
      return { selectedIds: [...state.selectedIds, id] };
    });
  },

  isSelected: (id) => {
    return get().selectedIds.includes(id);
  },

  startSelectionBox: (x, y) => {
    set({
      isSelecting: true,
      selectionBox: { x, y, width: 0, height: 0 },
    });
  },

  updateSelectionBox: (x, y) => {
    set((state) => {
      if (!state.selectionBox || !state.isSelecting) return state;

      const startX = state.selectionBox.x;
      const startY = state.selectionBox.y;

      return {
        selectionBox: {
          x: Math.min(startX, x),
          y: Math.min(startY, y),
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
        },
      };
    });
  },

  endSelectionBox: () => {
    const box = get().selectionBox;
    set({
      isSelecting: false,
      selectionBox: null,
    });
    return box;
  },
}));
