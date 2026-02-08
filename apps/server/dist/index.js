import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import * as Y from 'yjs';
import { setupWSConnection } from './websocket';
const PORT = parseInt(process.env.PORT || '1234', 10);
const HOST = process.env.HOST || '0.0.0.0';
// Store for Y.Doc instances per room
const docs = new Map();
// Track which rooms were explicitly created
const createdRooms = new Set();
// Get or create a Y.Doc for a room
function getYDoc(roomName, createIfNotExists) {
    let doc = docs.get(roomName);
    if (!doc && createIfNotExists) {
        doc = new Y.Doc();
        docs.set(roomName, doc);
        createdRooms.add(roomName);
        console.log(`Created new room: ${roomName}`);
    }
    return doc || null;
}
// Check if a room exists
function roomExists(roomName) {
    return createdRooms.has(roomName);
}
// Get list of active rooms
function getActiveRooms() {
    return Array.from(createdRooms);
}
// HTTP server for REST API
const server = createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    // GET /api/rooms - List all active rooms
    if (url.pathname === '/api/rooms' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rooms: getActiveRooms() }));
        return;
    }
    // GET /api/rooms/:id/exists - Check if room exists
    const existsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/exists$/);
    if (existsMatch && req.method === 'GET') {
        const roomId = decodeURIComponent(existsMatch[1]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: roomExists(roomId), roomId }));
        return;
    }
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});
// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const roomName = url.pathname.slice(1) || 'default';
    const shouldCreate = url.searchParams.get('create') === 'true';
    console.log(`Client attempting to connect to room: ${roomName} (create: ${shouldCreate})`);
    // Check if room exists or should be created
    const doc = getYDoc(roomName, shouldCreate);
    if (!doc) {
        console.log(`Room not found: ${roomName}`);
        ws.close(4004, 'Room not found');
        return;
    }
    console.log(`Client connected to room: ${roomName}`);
    setupWSConnection(ws, doc, roomName);
    ws.on('close', () => {
        console.log(`Client disconnected from room: ${roomName}`);
        // Clean up empty rooms after a delay
        setTimeout(() => {
            const connections = Array.from(wss.clients).filter((client) => {
                return client.roomName === roomName;
            });
            if (connections.length === 0) {
                docs.delete(roomName);
                createdRooms.delete(roomName);
                console.log(`Deleted empty room: ${roomName}`);
            }
        }, 30000);
    });
    // Store room name on the WebSocket for cleanup
    ws.roomName = roomName;
});
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});
server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`WebSocket: ws://${HOST}:${PORT}`);
    console.log(`REST API: http://${HOST}:${PORT}/api/rooms`);
    console.log('Waiting for connections...');
});
