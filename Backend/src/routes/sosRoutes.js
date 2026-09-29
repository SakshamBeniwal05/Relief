import express from 'express';
import { store } from '../data/store.js';

const router = express.Router();

/**
 * GET /api/sos/beacons
 * Returns all active BLE mesh distress signals and broadcasts
 */
router.get('/sos/beacons', (req, res) => {
  res.json({
    status: 'success',
    count: store.ble_mesh_beacons.length,
    data: store.ble_mesh_beacons,
  });
});

/**
 * POST /api/sos/broadcast
 * Citizen Emergency SOS trigger (BLE Mesh Store-and-Forward packet)
 */
router.post('/sos/broadcast', (req, res) => {
  const {
    senderHash = `NODE-UK-${Math.floor(100 + Math.random() * 900)}`,
    latitude = 30.556,
    longitude = 79.563,
    payloadText = 'EMERGENCY SOS: Civilian trapped, immediate rescue required.',
    emergencyType = 'CIVILIAN_TRAPPED',
  } = req.body;

  const beaconId = `MESH-BCN-${Date.now().toString().slice(-4)}`;
  const beaconHash = `SHA256:${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`;

  const newBeacon = {
    id: beaconId,
    beacon_hash: beaconHash,
    sender_device_hash: senderHash,
    latitude: Number(latitude),
    longitude: Number(longitude),
    payload_text: payloadText,
    hops_count: 1,
    relayed_via_peer_hash: 'GATEWAY-NODE-01',
    emergency_type: emergencyType,
    timestamp: new Date().toISOString(),
    status: 'relayed',
  };

  store.ble_mesh_beacons.unshift(newBeacon);

  // Audit log entry
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `CRISIS SOS TRIGGERED: [${emergencyType}]`,
    authInfo: `Mesh Receiver • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: `Distress beacon from ${senderHash} at (${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}): "${payloadText}"`,
    icon: 'sos',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    status: 'success',
    message: 'Distress packet broadcasted across BLE mesh store-and-forward nodes.',
    beacon: newBeacon,
  });
});

export default router;
