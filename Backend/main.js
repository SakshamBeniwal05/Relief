import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './src/app.js';
import { createStore } from './src/store.js';

// The main API owns persistence and remains available when the optional AI service is down.
const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_API_KEY) {
    throw new Error('Set ADMIN_API_KEY before starting in production.');
}

const store = await createStore();
let io;
const app = createApp({
    store,
    publish: (room, event, payload) => io?.to(room).emit(event, payload),
});
// Attach Express first so Socket.IO can route its transport without double-writing REST responses.
const server = createServer(app);
io = new Server(server, {
    cors: { origin: process.env.FRONTEND_ORIGIN ?? '*' },
});

io.on('connection', (socket) => {
    socket.join(['room-uttarakhand', 'room-alerts', 'room-ble-mesh']);
});

server.listen(port, () => {
    console.log(`Relief API listening on http://localhost:${port} (${store.mode} storage)`);
    if (!process.env.ADMIN_API_KEY) console.warn('Admin routes are unprotected; set ADMIN_API_KEY before exposing this server.');
});

async function shutdown() {
    io.close();
    await store.close();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);