import { WebSocketServer, WebSocket } from 'ws';
import { store } from '../data/store.js';

let wssInstance = null;

/**
 * Initializes the WebSocket server attached to the HTTP server
 */
export function initWebSocketServer(server) {
  if (wssInstance) {
    return wssInstance;
  }

  wssInstance = new WebSocketServer({ server });

  wssInstance.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress || 'unknown';
    console.log(`[WebSocket] Client connected from ${clientIp} (Total active: ${wssInstance.clients.size})`);

    // Send connection greeting
    ws.send(
      JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        system: 'SIH26191 Gov-Mesh WebSocket Gateway',
        status: 'CONNECTED',
        timestamp: new Date().toISOString(),
      })
    );

    // Sync latest active alert to newly connected clients (only if fresh within 60s)
    if (store.emergency_alerts && store.emergency_alerts.length > 0) {
      const latest = store.emergency_alerts[0];
      const alertTime = new Date(latest.created_at || latest.timestamp || Date.now()).getTime();
      const ageMs = Date.now() - alertTime;
      if (isNaN(ageMs) || ageMs < 60000) {
        try {
          ws.send(
            JSON.stringify({
              type: 'EMERGENCY_ALERT',
              payload: latest,
              isInitialSync: true,
            })
          );
        } catch (err) {
          // ignore
        }
      }
    }

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        } else if (
          (message.type === 'BROADCAST_ALERT' || message.type === 'EMERGENCY_ALERT') &&
          message.payload
        ) {
          // Store latest alert in memory only (not permanently stored across server reloads)
          store.emergency_alerts = [message.payload];

          // Fan out to all connected clients
          broadcastWebSocket({
            type: 'EMERGENCY_ALERT',
            payload: message.payload,
          });
        } else if (message.type === 'GAZETTE_ORDER' && message.payload) {
          broadcastWebSocket({
            type: 'GAZETTE_ORDER',
            payload: message.payload,
            report: message.report,
          });
        }
      } catch (err) {
        console.warn('[WebSocket] Malformed message received:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected (Remaining: ${wssInstance.clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client socket error:', err.message);
    });
  });

  console.log('[WebSocket] WebSocket Broadcast Server initialized on all paths (/ and /ws).');
  return wssInstance;
}

/**
 * Broadcasts an event payload to all currently connected clients
 */
export function broadcastWebSocket(event) {
  if (!wssInstance) {
    console.warn('[WebSocket] Cannot broadcast: WebSocket server not initialized.');
    return 0;
  }

  const payloadString = typeof event === 'string' ? event : JSON.stringify(event);
  let deliveredCount = 0;

  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payloadString);
        deliveredCount++;
      } catch (err) {
        console.error('[WebSocket] Failed to send to client:', err.message);
      }
    }
  });

  console.log(`[WebSocket] Broadcasted event "${event.type || 'UNKNOWN'}" to ${deliveredCount} client(s).`);
  return deliveredCount;
}

/**
 * Returns the count of connected active clients
 */
export function getConnectedClientsCount() {
  if (!wssInstance) return 0;
  let count = 0;
  wssInstance.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) count++;
  });
  return count;
}
