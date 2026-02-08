import { WebSocket } from 'ws';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface Connection {
  ws: WebSocket;
  awareness: awarenessProtocol.Awareness;
  doc: Y.Doc;
}

const connections = new Map<string, Set<Connection>>();

export function setupWSConnection(
  ws: WebSocket,
  doc: Y.Doc,
  roomName: string
): void {
  const awareness = new awarenessProtocol.Awareness(doc);

  const connection: Connection = { ws, awareness, doc };

  // Add connection to room
  if (!connections.has(roomName)) {
    connections.set(roomName, new Set());
  }
  connections.get(roomName)!.add(connection);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, doc);
  send(ws, encoding.toUint8Array(encoder));

  // Send initial awareness
  const awarenessEncoder = encoding.createEncoder();
  encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(
    awarenessEncoder,
    awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      Array.from(awareness.getStates().keys())
    )
  );
  send(ws, encoding.toUint8Array(awarenessEncoder));

  // Handle incoming messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC:
          handleSyncMessage(decoder, encoder, doc, ws, roomName);
          break;
        case MESSAGE_AWARENESS:
          handleAwarenessMessage(decoder, awareness, roomName);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle document updates
  const updateHandler = (update: Uint8Array, origin: any) => {
    if (origin !== ws) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      send(ws, encoding.toUint8Array(encoder));
    }
  };
  doc.on('update', updateHandler);

  // Handle awareness updates
  const awarenessUpdateHandler = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: any
  ) => {
    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    );

    // Broadcast to all clients in the room except the origin
    const roomConnections = connections.get(roomName);
    if (roomConnections) {
      const message = encoding.toUint8Array(encoder);
      roomConnections.forEach((conn) => {
        if (conn.ws !== origin && conn.ws.readyState === WebSocket.OPEN) {
          send(conn.ws, message);
        }
      });
    }
  };
  awareness.on('update', awarenessUpdateHandler);

  // Handle close
  ws.on('close', () => {
    doc.off('update', updateHandler);
    awareness.off('update', awarenessUpdateHandler);

    // Remove awareness state
    awarenessProtocol.removeAwarenessStates(
      awareness,
      [doc.clientID],
      'connection closed'
    );

    // Remove connection from room
    const roomConnections = connections.get(roomName);
    if (roomConnections) {
      roomConnections.delete(connection);
      if (roomConnections.size === 0) {
        connections.delete(roomName);
      }
    }
  });
}

function handleSyncMessage(
  decoder: decoding.Decoder,
  _encoder: encoding.Encoder,
  doc: Y.Doc,
  ws: WebSocket,
  roomName: string
): void {
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    syncEncoder,
    doc,
    ws
  );

  if (syncMessageType === 0) {
    // Received sync step 1, send sync step 2
    send(ws, encoding.toUint8Array(syncEncoder));
  } else if (syncMessageType === 2) {
    // Received update, broadcast to other clients
    const roomConnections = connections.get(roomName);
    if (roomConnections) {
      roomConnections.forEach((conn) => {
        if (conn.ws !== ws && conn.ws.readyState === WebSocket.OPEN) {
          send(conn.ws, encoding.toUint8Array(syncEncoder));
        }
      });
    }
  }
}

function handleAwarenessMessage(
  decoder: decoding.Decoder,
  awareness: awarenessProtocol.Awareness,
  _roomName: string
): void {
  const update = decoding.readVarUint8Array(decoder);
  awarenessProtocol.applyAwarenessUpdate(awareness, update, null);
}

function send(ws: WebSocket, message: Uint8Array): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  }
}
