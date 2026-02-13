import { useHistoryStore } from '@/store';

export function useHistory() {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
