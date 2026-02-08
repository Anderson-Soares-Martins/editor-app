import { useEffect, useCallback, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCanvasStore, useCollaborationStore } from '@/store';
import { nanoid } from 'nanoid';
import type { Shape, Layer } from '@editor-app/shared';

const WEBSOCKET_URL = 'ws://localhost:1234';
const API_URL = 'http://localhost:1234';

interface UseYjsSyncOptions {
  roomId: string | null;
  isCreating?: boolean;
}

interface UseYjsSyncResult {
  updateCursorPosition: (x: number, y: number) => void;
  disconnect: () => void;
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
}

// Check if a room exists via REST API
async function checkRoomExists(roomId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(roomId)}/exists`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.exists === true;
  } catch {
    return false;
  }
}

export function useYjsSync({ roomId, isCreating = false }: UseYjsSyncOptions): UseYjsSyncResult {
  const { shapes, layers, setState } = useCanvasStore();
  const {
    setConnected,
    setRoom,
    setUser,
    userName,
    userColor,
    updateCursor,
    clearCursors,
  } = useCollaborationStore();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const localUserIdRef = useRef<string>(nanoid());

  // Initialize Yjs
  useEffect(() => {
    if (!roomId) {
      setConnected(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      setIsLoading(true);
      setError(null);

      // If not creating, check if room exists first
      if (!isCreating) {
        const exists = await checkRoomExists(roomId);
        if (cancelled) return;

        if (!exists) {
          setError('Room not found. Please check the ID and try again.');
          setIsLoading(false);
          setConnected(false);
          return;
        }
      }

      // Build WebSocket URL with create parameter if needed
      const wsUrl = isCreating ? `${WEBSOCKET_URL}` : WEBSOCKET_URL;

      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      // Add create parameter to the room path
      const roomPath = isCreating ? `${roomId}?create=true` : roomId;
      const provider = new WebsocketProvider(wsUrl, roomPath, ydoc);
      providerRef.current = provider;

      const yShapes = ydoc.getMap<Shape>('shapes');
      const yLayers = ydoc.getArray<Layer>('layers');
      const yAwareness = provider.awareness;

      // Set local user info
      setUser(localUserIdRef.current, userName, userColor);
      setRoom(roomId);

      // Handle connection status
      provider.on('status', (event: { status: string }) => {
        if (cancelled) return;
        const connected = event.status === 'connected';
        setConnected(connected);
        setIsLoading(false);

        if (!connected && event.status === 'disconnected') {
          // Check if it was a rejection (room not found)
          // The WebSocket will close with code 4004 if room not found
        }
      });

      // Handle WebSocket close
      provider.on('connection-close', (event: CloseEvent | null) => {
        if (cancelled) return;
        if (event && event.code === 4004) {
          setError('Room not found. Please check the ID and try again.');
          setConnected(false);
        }
      });

      // Initialize awareness (cursor positions)
      yAwareness.setLocalStateField('user', {
        id: localUserIdRef.current,
        name: userName,
        color: userColor,
      });

      // Handle awareness changes (cursors)
      yAwareness.on('change', () => {
        if (cancelled) return;
        const states = yAwareness.getStates();
        states.forEach((state, clientId) => {
          if (clientId === ydoc.clientID) return;

          const userState = state.user;
          const cursorState = state.cursor;

          if (userState && cursorState) {
            updateCursor({
              id: userState.id,
              name: userState.name,
              color: userState.color,
              x: cursorState.x,
              y: cursorState.y,
            });
          }
        });
      });

      // Sync remote changes to local state
      yShapes.observe(() => {
        if (isRemoteUpdateRef.current || cancelled) return;

        isRemoteUpdateRef.current = true;
        const newShapes: Record<string, Shape> = {};
        yShapes.forEach((value, key) => {
          newShapes[key] = value;
        });
        setState({ shapes: newShapes });
        isRemoteUpdateRef.current = false;
      });

      yLayers.observe(() => {
        if (isRemoteUpdateRef.current || cancelled) return;

        isRemoteUpdateRef.current = true;
        const newLayers = yLayers.toArray();
        setState({ layers: newLayers });
        isRemoteUpdateRef.current = false;
      });

      // Initial sync from Yjs
      if (yShapes.size > 0 || yLayers.length > 0) {
        const initialShapes: Record<string, Shape> = {};
        yShapes.forEach((value, key) => {
          initialShapes[key] = value;
        });

        setState({
          shapes: initialShapes,
          layers: yLayers.toArray(),
        });
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      clearCursors();
      setConnected(false);
    };
  }, [roomId, isCreating, userName, userColor, setState, setConnected, setRoom, setUser, updateCursor, clearCursors]);

  // Sync local changes to Yjs
  useEffect(() => {
    if (!ydocRef.current || !providerRef.current || isRemoteUpdateRef.current) return;

    const ydoc = ydocRef.current;
    const yShapes = ydoc.getMap<Shape>('shapes');
    const yLayers = ydoc.getArray<Layer>('layers');

    ydoc.transact(() => {
      // Sync shapes
      const currentShapeIds = new Set(Object.keys(shapes));
      const yShapeIds = new Set<string>();
      yShapes.forEach((_, key) => yShapeIds.add(key));

      // Add or update shapes
      Object.entries(shapes).forEach(([id, shape]) => {
        const existing = yShapes.get(id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(shape)) {
          yShapes.set(id, shape);
        }
      });

      // Remove deleted shapes
      yShapeIds.forEach((id) => {
        if (!currentShapeIds.has(id)) {
          yShapes.delete(id);
        }
      });

      // Sync layers
      if (yLayers.length !== layers.length ||
          JSON.stringify(yLayers.toArray()) !== JSON.stringify(layers)) {
        yLayers.delete(0, yLayers.length);
        layers.forEach((layer) => yLayers.push([layer]));
      }
    });
  }, [shapes, layers]);

  // Update cursor position
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!providerRef.current) return;

      providerRef.current.awareness.setLocalStateField('cursor', { x, y });
    },
    []
  );

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    clearCursors();
    setConnected(false);
    setRoom(null);
    setError(null);
  }, [clearCursors, setConnected, setRoom]);

  return {
    updateCursorPosition,
    disconnect,
    isConnected: providerRef.current?.wsconnected ?? false,
    error,
    isLoading,
  };
}
