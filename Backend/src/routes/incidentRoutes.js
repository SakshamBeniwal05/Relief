import express from 'express';
import { store } from '../data/store.js';
import { getIncidentsWithinRadius } from '../services/spatialEngine.js';

const router = express.Router();

/**
 * Maps store incident to the frontend GeoIncident format
 */
function formatGeoIncident(inc) {
  return {
    id: inc.id,
    title: inc.title,
    severity: inc.severity,
    locationText: inc.location_text || 'Chamoli District',
    coordinates: `${inc.coordinates.lat.toFixed(4)}° N, ${inc.coordinates.lng.toFixed(4)}° E`,
    timeAgo: inc.time_ago || 'Just now',
    photoUrl: inc.photo_url || '',
    gpsDelta: inc.gps_delta || '2.0m (Verified)',
    hardwareClockStatus: inc.hardware_clock_status || 'Synced',
    cvConfidence: inc.cv_confidence || 90.0,
    status: inc.status,
  };
}

/**
 * GET /api/incidents
 * Query params: status, type, lat, lng, radiusKm
 */
router.get('/incidents', (req, res) => {
  const { status, type, lat, lng, radiusKm, format } = req.query;

  let results = [...store.incidents];

  if (lat && lng) {
    results = getIncidentsWithinRadius(Number(lat), Number(lng), Number(radiusKm || 25));
  }

  if (status) {
    results = results.filter((inc) => inc.status.toLowerCase() === status.toLowerCase());
  }

  if (type) {
    results = results.filter((inc) => inc.type.toLowerCase() === type.toLowerCase());
  }

  // If format=frontend, return formatted for Admin Geocam Queue
  if (format === 'admin') {
    return res.json({
      status: 'success',
      count: results.length,
      data: results.map(formatGeoIncident),
    });
  }

  res.json({
    status: 'success',
    count: results.length,
    data: results,
  });
});

/**
 * GET /api/incidents/:id
 */
router.get('/incidents/:id', (req, res) => {
  const incident = store.incidents.find((i) => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ status: 'error', message: 'Incident not found' });
  }

  res.json({
    status: 'success',
    data: incident,
  });
});

/**
 * PATCH /api/incidents/:id
 * Updates incident status (verified, escalated, dismissed)
 */
router.patch('/incidents/:id', (req, res) => {
  const { status, resolution_notes } = req.body;
  const index = store.incidents.findIndex((i) => i.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Incident not found' });
  }

  if (status) {
    store.incidents[index].status = status;
  }
  if (resolution_notes) {
    store.incidents[index].resolution_notes = resolution_notes;
  }
  store.incidents[index].updated_at = new Date().toISOString();

  // Audit log entry
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `Incident ${req.params.id} Status: ${status?.toUpperCase()}`,
    authInfo: `Triage Desk • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: `Incident "${store.incidents[index].title}" triaged to ${status}.`,
    icon: status === 'verified' ? 'verified' : status === 'escalated' ? 'warning' : 'block',
    iconBg: status === 'verified' ? 'bg-secondary-container' : 'bg-error-container',
    iconColor: status === 'verified' ? 'text-primary' : 'text-error',
    timestamp: new Date().toISOString(),
  });

  res.json({
    status: 'success',
    message: `Incident ${req.params.id} updated successfully`,
    data: formatGeoIncident(store.incidents[index]),
  });
});

export default router;
