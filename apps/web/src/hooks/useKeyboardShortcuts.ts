import { useEffect, useCallback } from 'react';
import { useToolStore, useCanvasStore, useSelectionStore } from '@/store';
import { useHistory } from './useHistory';
import { useSelection } from './useSelection';

export function useKeyboardShortcuts() {
  const { setTool } = useToolStore();
  const { deleteShapes, duplicateShapes, viewport, zoomTo, fitToScreen } = useCanvasStore();
  const { selectedIds, clearSelection, selectMultiple } = useSelectionStore();
  const { undo, redo } = useHistory();
  const { selectAll } = useSelection();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!isCtrlOrCmd && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setTool('select');
            break;
          case 'h':
            setTool('pan');
            break;
          case 'r':
            setTool('rectangle');
            break;
          case 'o':
            setTool('circle');
            break;
          case 'l':
            setTool('line');
            break;
          case 't':
            setTool('text');
            break;
          case 'i':
            setTool('image');
            break;
          case 'escape':
            clearSelection();
            setTool('select');
            break;
          case 'delete':
          case 'backspace':
            if (selectedIds.length > 0) {
              deleteShapes(selectedIds);
              clearSelection();
            }
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 'd':
            e.preventDefault();
            if (selectedIds.length > 0) {
              const newIds = duplicateShapes(selectedIds);
              selectMultiple(newIds);
            }
            break;
          case '0':
            e.preventDefault();
            zoomTo(1);
            break;
          case '1':
            e.preventDefault();
            fitToScreen(window.innerWidth - 560, window.innerHeight - 48);
            break;
          case '=':
          case '+':
            e.preventDefault();
            zoomTo(viewport.scale * 1.25);
            break;
          case '-':
            e.preventDefault();
            zoomTo(viewport.scale / 1.25);
            break;
        }
      }
    },
    [
      setTool,
      clearSelection,
      selectedIds,
      deleteShapes,
      undo,
      redo,
      selectAll,
      duplicateShapes,
      selectMultiple,
      viewport,
      zoomTo,
      fitToScreen,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
