import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel, LayersPanel } from './components/Panels';
import { CollaborationPanel } from './components/Collaboration';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useYjsSync } from './hooks/useYjsSync';
import styles from './App.module.css';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Check URL for room parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      // Joining from URL means the room should exist
      setIsCreating(false);
      setRoomId(room);
    }
  }, []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize Yjs sync
  const { updateCursorPosition, disconnect, error, isLoading } = useYjsSync({
    roomId,
    isCreating,
  });

  // Handle cursor move from canvas (already in canvas coordinates)
  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      if (roomId) {
        updateCursorPosition(x, y);
      }
    },
    [roomId, updateCursorPosition]
  );

  const handleJoinRoom = useCallback((newRoomId: string) => {
    setIsCreating(false);
    setRoomId(newRoomId);
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoomId);
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleCreateRoom = useCallback((newRoomId: string) => {
    setIsCreating(true);
    setRoomId(newRoomId);
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoomId);
    window.history.pushState({}, '', url.toString());
  }, []);

  const handleLeaveRoom = useCallback(() => {
    disconnect();
    setRoomId(null);
    setIsCreating(false);
    // Remove room from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  }, [disconnect]);

  return (
    <div className={styles.app}>
      <Toolbar />
      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <LayersPanel />
        </div>
        <Canvas onCursorMove={handleCursorMove} />
        <div className={styles.rightPanel}>
          <CollaborationPanel
            roomId={roomId}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onLeaveRoom={handleLeaveRoom}
            error={error}
            isLoading={isLoading}
          />
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
