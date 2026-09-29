/**
 * SIH26191 Real-Time WebSocket & BroadcastChannel Client Service
 * Manages live full-duplex communication between Admin Command Center and Citizen Devices.
 * Broadcasts emergency threat alerts and official gazette relocation directives instantly across all windows & browsers.
 */

import type { EmergencyBroadcastAlert } from '../user/component/alert/BroadcastAlertModal';
import { addRuntimeGovernmentDirective } from './api';

let socket: WebSocket | null = null;
let reconnectTimer: any = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 6000;

export type WebSocketStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
let currentStatus: WebSocketStatus = 'DISCONNECTED';

// Native BroadcastChannel for zero-latency peer sync across tabs in the same browser session
const PEER_CHANNEL_NAME = 'sih_emergency_broadcast_mesh';
let peerChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    peerChannel = new BroadcastChannel(PEER_CHANNEL_NAME);
    peerChannel.onmessage = (event) => {
      if (event.data?.type) {
        console.log('📡 [BroadcastChannel] Received peer broadcast:', event.data.type);
        handleIncomingMessage(event.data, true /* fromPeerChannel */);
      }
    };
  } catch (err) {
    console.warn('[BroadcastChannel] Initialization skipped:', err);
  }
}

let pingInterval: any = null;

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3000/ws';
  const hostname = window.location.hostname || 'localhost';
  return `ws://${hostname}:3000/ws`;
}

/**
 * Connects to the SIH26191 Command Backend WebSocket Server
 */
export function initWebSocketConnection(): WebSocket | null {
  if (typeof window === 'undefined') return null;

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  currentStatus = 'CONNECTING';
  notifyStatusChange();

  const wsUrl = getWebSocketUrl();
  console.log(`[WebSocket] Connecting to Command Gateway: ${wsUrl}`);

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ [WebSocket] Connected to SIH26191 Command WebSocket Gateway.');
      currentStatus = 'CONNECTED';
      reconnectAttempts = 0;
      notifyStatusChange();

      // Send initial keepalive / handshake
      try {
        socket?.send(JSON.stringify({ type: 'PING', client: 'SIH26191_WEB_CLIENT' }));
      } catch (err) {
        // ignore
      }

      // Maintain active 10s keepalive ping to prevent proxy/browser timeout
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
          } catch (e) {
            // ignore
          }
        }
      }, 10000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data, false);
      } catch (err) {
        console.warn('[WebSocket] Received non-JSON packet:', event.data);
      }
    };

    socket.onclose = (event) => {
      if (pingInterval) clearInterval(pingInterval);
      console.warn(`⚠️ [WebSocket] Connection closed (code: ${event.code}). Scheduling reconnect...`);
      currentStatus = 'DISCONNECTED';
      socket = null;
      notifyStatusChange();
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      if (pingInterval) clearInterval(pingInterval);
      console.error('❌ [WebSocket] Socket error:', err);
      currentStatus = 'DISCONNECTED';
      notifyStatusChange();
    };
  } catch (err) {
    console.error('[WebSocket] Initialization error:', err);
    scheduleReconnect();
  }

  return socket;
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * Math.pow(1.3, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    initWebSocketConnection();
  }, delay);
}

function notifyStatusChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sih-ws-status', { detail: { status: currentStatus } })
    );
  }
}

/**
 * Handles incoming WebSocket and peer channel events
 */
function handleIncomingMessage(data: any, fromPeerChannel = false) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'BROADCAST_ALERT':
    case 'EMERGENCY_ALERT': {
      const alert: EmergencyBroadcastAlert = data.payload;
      if (!alert) return;
      console.log('🚨 [Live Alert Broadcast Received]:', alert.targetSector, alert.orderType);

      const alertPayloadWithTimestamp = {
        ...alert,
        _rx_timestamp: Date.now(),
      };

      // 1. Sync to localStorage & sessionStorage so same-browser tabs fire the storage event
      try {
        localStorage.setItem('sih_latest_broadcast', JSON.stringify(alertPayloadWithTimestamp));
        sessionStorage.setItem('sih_latest_broadcast', JSON.stringify(alertPayloadWithTimestamp));
      } catch (e) {
        // ignore
      }

      // 2. Register into transient active government directives so it showcases in Govt Directives during the session
      try {
        const coords =
          alert.sectorCoords ||
          (alert as any).coordinates || { lat: 30.556, lng: 79.563 };
        const govDirective = {
          id: alert.id,
          order_code: `#${alert.id}`,
          sector: alert.targetSector,
          targetSector: alert.targetSector,
          sectorKey: (alert.targetSector || '').toLowerCase().split(' ')[0],
          coordinates: coords,
          threatRadiusMeters: alert.threatRadiusMeters || 3200,
          orderType: alert.orderType || 'Official Emergency Government Directive',
          authority: alert.authorizedBy || 'District Magistrate & SDRF Unified Command',
          directiveText: alert.directiveText,
          threat_severity: alert.threatSeverity || 'CRITICAL',
          threatCategory: alert.threatCategory || 'Multi-Hazard Threat',
          status: 'ENFORCED',
          has_active_gov_order: true,
          ai_prediction_superseded: true,
          timestamp: alert.timestamp,
          created_at: new Date().toISOString(),
        };
        addRuntimeGovernmentDirective(govDirective);
      } catch (e) {
        // ignore
      }

      // 3. Dispatch custom event for App.tsx and alert modals to pop up
      window.dispatchEvent(
        new CustomEvent('sih-emergency-alert', { detail: alert })
      );

      // 4. Relay across peer BroadcastChannel if received via WebSocket (fans out to same-browser tabs)
      if (!fromPeerChannel && peerChannel) {
        try {
          peerChannel.postMessage({ type: 'EMERGENCY_ALERT', payload: alert });
        } catch (err) {
          // ignore
        }
      }
      break;
    }

    case 'GAZETTE_ORDER': {
      const { payload: order, report } = data;
      console.log('📜 [Official Gazette Order Received]:', order?.title || order?.sector);

      try {
        if (order) {
          addRuntimeGovernmentDirective(order);
        }
      } catch (e) {
        // ignore
      }

      window.dispatchEvent(
        new CustomEvent('sih-gazette-order', { detail: { order, report } })
      );

      if (!fromPeerChannel && peerChannel) {
        try {
          peerChannel.postMessage(data);
        } catch (err) {
          // ignore
        }
      }
      break;
    }

    case 'CONNECTION_ESTABLISHED':
    case 'PONG':
      break;

    default:
      console.log('[WebSocket] Event received:', data.type);
  }
}

/**
 * Transmits an event payload across WebSocket and peer BroadcastChannel
 */
export function sendWebSocketBroadcast(
  type: 'BROADCAST_ALERT' | 'EMERGENCY_ALERT' | 'GAZETTE_ORDER',
  payload: any
): boolean {
  const packet = { type, payload, timestamp: Date.now() };

  // 1. Broadcast locally across peer BroadcastChannel (instant zero-latency across tabs)
  if (peerChannel) {
    try {
      peerChannel.postMessage(packet);
    } catch (err) {
      console.warn('[BroadcastChannel] Failed to post message:', err);
    }
  }

  // 2. Transmit across active WebSocket connection to server
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(packet));
      return true;
    } catch (err) {
      console.error('[WebSocket] Failed to send broadcast over socket:', err);
    }
  } else {
    // If socket is disconnected, try reconnecting
    initWebSocketConnection();
  }

  return false;
}

/**
 * Returns current WebSocket connection state
 */
export function getWebSocketStatus(): WebSocketStatus {
  return currentStatus;
}
