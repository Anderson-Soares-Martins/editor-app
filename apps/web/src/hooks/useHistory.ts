import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore, useHistoryStore } from '@/store';

export function useHistory() {
  const { shapes, layers, setState } = useCanvasStore();
  const { pushState, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = useHistoryStore();
  const isUndoRedoRef = useRef(false);
  const prevStateRef = useRef<{ shapes: typeof shapes; layers: typeof layers } | null>(null);

  // Track changes and push to history
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      prevStateRef.current = { shapes, layers };
      return;
    }

    const prevState = prevStateRef.current;
    if (prevState && (prevState.shapes !== shapes || prevState.layers !== layers)) {
      // State has changed, push previous state to history
      if (Object.keys(prevState.shapes).length > 0 || prevState.layers.length > 0) {
        pushState(prevState.shapes, prevState.layers);
      }
    }

    prevStateRef.current = { shapes, layers };
  }, [shapes, layers, pushState]);

  const undo = useCallback(() => {
    if (!canUndo()) return;

    const entry = undoHistory();
    if (entry) {
      isUndoRedoRef.current = true;
      setState({
        shapes: entry.shapes,
        layers: entry.layers,
      });
    }
  }, [canUndo, undoHistory, setState]);

  const redo = useCallback(() => {
    if (!canRedo()) return;

    const entry = redoHistory();
    if (entry) {
      isUndoRedoRef.current = true;
      setState({
        shapes: entry.shapes,
        layers: entry.layers,
      });
    }
  }, [canRedo, redoHistory, setState]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
