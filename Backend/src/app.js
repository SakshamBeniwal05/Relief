import express from 'express';
import { randomUUID } from 'node:crypto';

const collections = ['hazards', 'incidents', 'volunteers', 'shelters', 'habitations', 'timelines', 'directives', 'activity', 'evidence', 'beacons'];
const volunteerStatuses = new Set(['approved', 'deployed', 'rejected']);
const incidentStatuses = new Set(['verified', 'escalated', 'dismissed']);

function fail(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function requiredText(value, field, maxLength = 1000) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    fail(400, 'INVALID_FIELD', `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function numberField(value, field, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    fail(400, 'INVALID_FIELD', `${field} must be between ${min} and ${max}.`);
  }
  return number;
}

function coordinatesFrom(body) {
  const lat = body.latitude ?? body.coordinates?.lat ?? body.coordinates?.latitude;
  const lng = body.longitude ?? body.coordinates?.lng ?? body.coordinates?.longitude;
  if (lat !== undefined && lng !== undefined) {
    return { latitude: numberField(lat, 'latitude', -90, 90), longitude: numberField(lng, 'longitude', -180, 180) };
  }
  if (typeof body.location === 'string') {
    const values = body.location.match(/-?\d+(?:\.\d+)?/g);
    if (values?.length >= 2) {
      return { latitude: numberField(values[0], 'latitude', -90, 90), longitude: numberField(values[1], 'longitude', -180, 180) };
    }
  }
  fail(400, 'COORDINATES_REQUIRED', 'Provide latitude and longitude (WGS84).');
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function adminOnly(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (expected && req.get('authorization') !== `Bearer ${expected}`) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid admin bearer token is required.' } });
  }
  return next();
}

function specializationType(specialization) {
  const value = specialization.toLowerCase();
  if (/medical|doctor|paramedic|nurs/.test(value)) return 'medical';
  if (/driver|vehicle|4x4|transport/.test(value)) return 'vehicle';
  if (/radio|ham|communication/.test(value)) return 'radio';
  return 'rescue';
}

export function createApp({ store, publish = () => {}, aiEngineUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:3100', fetchImpl = fetch }) {
  if (!store) throw new Error('createApp requires a store instance.');
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  const api = express.Router();
  app.use('/api', api);

  api.get('/health', (req, res) => res.json({ status: 'ok', storage: store.mode, timestamp: new Date().toISOString() }));

  api.get('/districts/telemetry', async (req, res) => res.json({ data: await store.list('districtTelemetry') }));

  api.get('/ai/status', async (req, res) => {
    try {
      const response = await fetchImpl(`${aiEngineUrl}/health`, { signal: AbortSignal.timeout(800) });
      const engine = response.ok ? await response.json() : null;
      return res.json({ data: { mainEngine: 'ok', aiEngine: { status: response.ok ? 'online' : 'unavailable', details: engine } } });
    } catch {
      return res.json({ data: { mainEngine: 'ok', aiEngine: { status: 'offline', details: null } } });
    }
  });

  api.get('/ai/jobs', async (req, res) => res.json({ data: await store.list('aiJobs') }));
  api.get('/ai/jobs/:id', async (req, res) => {
    const job = await store.get('aiJobs', req.params.id);
    if (!job) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prediction job not found.' } });
    return res.json({ data: job });
  });

  api.post('/ai/jobs', async (req, res) => {
    const records = req.body.records;
    if (!Array.isArray(records) || records.length < 1 || records.length > 50) {
      fail(400, 'INVALID_BATCH_SIZE', 'Submit between 1 and 50 district telemetry records.');
    }
    const normalizedRecords = records.map((record, index) => ({
      district: requiredText(record.district, `records[${index}].district`, 120),
      station: typeof record.station === 'string' ? record.station.slice(0, 160) : 'Unknown station',
      rainfallMmh: numberField(record.rainfallMmh, `records[${index}].rainfallMmh`, 0, 1000),
      porePressureKpa: numberField(record.porePressureKpa, `records[${index}].porePressureKpa`, 0, 10000),
      soilSaturationPct: numberField(record.soilSaturationPct, `records[${index}].soilSaturationPct`, 0, 100),
      slopeTiltDeg: numberField(record.slopeTiltDeg, `records[${index}].slopeTiltDeg`, 0, 90),
      factorOfSafety: numberField(record.factorOfSafety, `records[${index}].factorOfSafety`, 0, 10),
    }));
    const job = await store.create('aiJobs', {
      status: 'queued',
      recordsCount: normalizedRecords.length,
      source: 'districtTelemetry',
      results: [],
      error: null,
    });
    publish('room-uttarakhand', 'ai:job:updated', job);
    setImmediate(async () => {
      try {
        await store.update('aiJobs', job.id, { status: 'running', startedAt: new Date().toISOString() });
        const response = await fetchImpl(`${aiEngineUrl}/api/predict`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, records: normalizedRecords }),
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok) throw new Error(`AI engine returned HTTP ${response.status}.`);
        const prediction = await response.json();
        const completed = await store.update('aiJobs', job.id, {
          status: 'completed',
          results: prediction.predictions,
          modelVersion: prediction.modelVersion,
          completedAt: new Date().toISOString(),
        });
        publish('room-uttarakhand', 'ai:job:updated', completed);
      } catch (error) {
        const unavailable = await store.update('aiJobs', job.id, {
          status: 'engine_unavailable',
          error: error instanceof Error ? error.message : 'AI engine unavailable.',
          completedAt: new Date().toISOString(),
        });
        publish('room-uttarakhand', 'ai:job:updated', unavailable);
      }
    });
    return res.status(202).json({ data: job });
  });

  api.post('/ai/engine/crash', adminOnly, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Crash simulation is disabled in production.' } });
    }
    try {
      const response = await fetchImpl(`${aiEngineUrl}/simulate-crash`, {
        method: 'POST',
        signal: AbortSignal.timeout(1000),
      });
      if (!response.ok) fail(502, 'CRASH_SIMULATION_FAILED', 'AI engine refused the crash simulation.');
      return res.status(202).json({ data: { status: 'crash_requested', mainEngine: 'ok' } });
    } catch (error) {
      if (error.statusCode) throw error;
      return res.status(503).json({ error: { code: 'AI_ENGINE_OFFLINE', message: 'AI engine is already offline. Main backend is still available.' } });
    }
  });

  api.get('/hazards', async (req, res) => res.json({ data: await store.list('hazards') }));
  api.get('/hazards/:id', async (req, res) => {
    const hazard = await store.get('hazards', req.params.id);
    if (!hazard) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Hazard not found.' } });
    return res.json({ data: hazard });
  });

  api.get('/incidents/nearby', async (req, res) => {
    const latitude = numberField(req.query.lat, 'lat', -90, 90);
    const longitude = numberField(req.query.lng, 'lng', -180, 180);
    const radius = numberField(req.query.radius ?? 5000, 'radius', 1, 100000);
    const data = await store.nearbyIncidents(latitude, longitude, radius);
    return res.json({ data: data.filter((item) => item.status === 'verified' || item.status === 'VERIFIED') });
  });
  api.get('/incidents', async (req, res) => {
    const data = (await store.list('incidents')).filter((item) => item.status === 'verified' || item.status === 'VERIFIED');
    return res.json({ data });
  });
  api.post('/incidents', async (req, res) => {
    const targetSector = requiredText(req.body.targetSector, 'targetSector', 160);
    const description = requiredText(req.body.observationNotes ?? req.body.description, 'observationNotes', 4000);
    const { latitude, longitude } = coordinatesFrom(req.body);
    const record = await store.create('incidents', {
      title: targetSector,
      locationText: targetSector,
      latitude,
      longitude,
      coordinates: `${latitude}, ${longitude}`,
      description,
      photoUrl: typeof req.body.photoUrl === 'string' ? req.body.photoUrl : '',
      severity: 'MEDIUM RISK',
      reporterType: 'CITIZEN',
      status: 'pending',
      verificationStatus: 'UNDER_VERIFICATION',
      gpsDelta: 'Pending validation',
      hardwareClockStatus: 'Pending validation',
      cvConfidence: 0,
    });
    publish('room-uttarakhand', 'incident:created', record);
    publish('room-alerts', 'incident:created', record);
    return res.status(201).json({ data: record });
  });
  api.get('/incidents/:id/evidence', async (req, res) => {
    const data = (await store.list('evidence')).filter((item) => item.incidentId === req.params.id);
    return res.json({ data });
  });
  api.post('/incidents/:id/evidence', async (req, res) => {
    const incident = await store.get('incidents', req.params.id);
    if (!incident) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incident not found.' } });
    const mediaUrl = requiredText(req.body.photoUrl, 'photoUrl', 2048);
    const exifLatitude = numberField(req.body.exifLatitude, 'exifLatitude', -90, 90);
    const exifLongitude = numberField(req.body.exifLongitude, 'exifLongitude', -180, 180);
    const browserLatitude = numberField(req.body.browserLatitude, 'browserLatitude', -90, 90);
    const browserLongitude = numberField(req.body.browserLongitude, 'browserLongitude', -180, 180);
    const capturedAt = new Date(req.body.capturedAtUtc);
    if (Number.isNaN(capturedAt.getTime())) fail(400, 'INVALID_CAPTURE_TIME', 'capturedAtUtc must be a valid UTC timestamp.');
    const gpsDelta = distanceMeters(exifLatitude, exifLongitude, browserLatitude, browserLongitude);
    if (gpsDelta >= 300) fail(422, 'SPOOFED_LOCATION_PRANK', 'Photo GPS is more than 300 metres from the reported device location.');
    if (Math.abs(Date.now() - capturedAt.getTime()) >= 120000) fail(422, 'HISTORICAL_REPOST', 'Photo capture time is more than 120 seconds from server time.');
    const cvConfidence = numberField(req.body.cvConfidence ?? 0, 'cvConfidence', 0, 100);
    const evidence = await store.create('evidence', {
      incidentId: incident.id,
      mediaUrl,
      exifLatitude,
      exifLongitude,
      capturedAtUtc: capturedAt.toISOString(),
      aiFilterConfidence: cvConfidence,
      isValidated: cvConfidence >= 50,
      uploadedAt: new Date().toISOString(),
      gpsDeltaMeters: Number(gpsDelta.toFixed(1)),
    });
    await store.update('incidents', incident.id, {
      photoUrl: mediaUrl,
      gpsDelta: `${gpsDelta.toFixed(1)}m (Hardware Match)`,
      hardwareClockStatus: 'Synced',
      cvConfidence,
    });
    publish('room-uttarakhand', 'evidence:created', evidence);
    return res.status(201).json({ data: evidence });
  });

  api.post('/volunteers', async (req, res) => {
    const name = requiredText(req.body.fullName ?? req.body.name, 'fullName', 120);
    const phone = requiredText(req.body.mobile ?? req.body.phone, 'mobile', 32);
    if (phone.replace(/\D/g, '').length < 7) fail(400, 'INVALID_PHONE', 'mobile must contain at least 7 digits.');
    const specialization = requiredText(req.body.specialization, 'specialization', 120);
    const record = await store.create('volunteers', {
      name,
      phone,
      govId: 'Pending verification',
      specialization,
      specializationType: specializationType(specialization),
      sector: typeof req.body.sector === 'string' ? req.body.sector.slice(0, 160) : 'Uttarakhand (unassigned)',
      availability: typeof req.body.notes === 'string' ? req.body.notes.slice(0, 500) : 'Availability to be confirmed',
      verificationBadge: 'Pending verification',
      status: 'pending',
    });
    publish('room-uttarakhand', 'volunteer:created', record);
    return res.status(201).json({ data: { id: record.id, status: record.status, message: 'Application received.' } });
  });
  api.get('/admin/volunteers', adminOnly, async (req, res) => res.json({ data: await store.list('volunteers') }));
  api.patch('/admin/volunteers/:id', adminOnly, async (req, res) => {
    if (!volunteerStatuses.has(req.body.status)) fail(400, 'INVALID_STATUS', 'status must be approved, deployed, or rejected.');
    const record = await store.update('volunteers', req.params.id, { status: req.body.status });
    if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Volunteer application not found.' } });
    publish('room-uttarakhand', 'volunteer:updated', record);
    await store.create('activity', { id: `log-${randomUUID()}`, title: `Volunteer ${req.body.status}: ${record.name}`, authInfo: 'Admin command center', description: `${record.specialization} application status changed.`, icon: 'person_check', iconBg: 'bg-secondary-container', iconColor: 'text-primary' });
    return res.json({ data: record });
  });

  api.get('/admin/incidents', adminOnly, async (req, res) => res.json({ data: await store.list('incidents') }));
  api.patch('/admin/incidents/:id', adminOnly, async (req, res) => {
    if (!incidentStatuses.has(req.body.status)) fail(400, 'INVALID_STATUS', 'status must be verified, escalated, or dismissed.');
    const record = await store.update('incidents', req.params.id, {
      status: req.body.status,
      verificationStatus: req.body.status.toUpperCase(),
    });
    if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incident not found.' } });
    publish('room-uttarakhand', 'incident:updated', record);
    publish('room-alerts', 'incident:updated', record);
    return res.json({ data: record });
  });

  api.get('/shelters', async (req, res) => res.json({ data: await store.list('shelters') }));
  api.get('/shelters/:id', async (req, res) => {
    const shelter = await store.get('shelters', req.params.id);
    if (!shelter) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shelter not found.' } });
    return res.json({ data: shelter });
  });
  api.get('/routes/nearest-shelter', async (req, res) => {
    const latitude = numberField(req.query.lat, 'lat', -90, 90);
    const longitude = numberField(req.query.lng, 'lng', -180, 180);
    const shelter = await store.nearestShelter(latitude, longitude);
    if (!shelter) return res.status(404).json({ error: { code: 'NO_AVAILABLE_SHELTER', message: 'No shelter has available beds.' } });
    return res.json({ data: { shelter, distanceMeters: Math.round(shelter.distanceMeters), geometry: { type: 'LineString', coordinates: [[longitude, latitude], [shelter.longitude, shelter.latitude]] }, routing: 'straight-line estimate; configure a routing engine for road directions' } });
  });
  api.get('/habitations', async (req, res) => res.json({ data: await store.list('habitations') }));
  api.get('/timelines', async (req, res) => res.json({ data: await store.list('timelines') }));
  api.get('/timelines/:id', async (req, res) => {
    const timeline = await store.get('timelines', req.params.id);
    if (!timeline) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Timeline not found.' } });
    return res.json({ data: timeline });
  });

  api.get('/directives', async (req, res) => res.json({ data: (await store.list('directives')).filter((item) => item.active !== false) }));
  api.post('/admin/directives', adminOnly, async (req, res) => {
    const record = await store.create('directives', {
      orderType: requiredText(req.body.orderType, 'orderType', 120),
      targetSector: requiredText(req.body.targetSector, 'targetSector', 160),
      directiveText: requiredText(req.body.directiveText, 'directiveText', 4000),
      pushBleMeshSiren: Boolean(req.body.pushBleMeshSiren),
      active: true,
    });
    publish('room-uttarakhand', 'directive:created', record);
    publish('room-alerts', 'directive:created', record);
    await store.create('activity', { id: `log-${randomUUID()}`, title: `${record.orderType}: ${record.targetSector}`, authInfo: 'Admin command center', description: record.directiveText, icon: 'gavel', iconBg: 'bg-error-container', iconColor: 'text-error' });
    return res.status(201).json({ data: record });
  });
  api.get('/activity', async (req, res) => res.json({ data: await store.list('activity') }));

  api.post('/sos/sync', async (req, res) => {
    const incoming = Array.isArray(req.body.packets) ? req.body.packets : [req.body];
    if (incoming.length < 1 || incoming.length > 100) fail(400, 'INVALID_BATCH_SIZE', 'Submit between 1 and 100 SOS packets.');
    const records = [];
    for (const packet of incoming) {
      const { latitude, longitude } = coordinatesFrom(packet);
      const payloadText = requiredText(packet.payloadText ?? packet.message, 'payloadText', 255);
      records.push(await store.create('beacons', {
        senderDeviceHash: typeof packet.deviceHash === 'string' ? packet.deviceHash.slice(0, 64) : 'anonymous',
        latitude,
        longitude,
        payloadText,
        hopsCount: numberField(packet.hopsCount ?? 0, 'hopsCount', 0, 1000),
        relayedViaPeerHash: typeof packet.relayedViaPeerHash === 'string' ? packet.relayedViaPeerHash.slice(0, 64) : null,
        syncedToServerAt: new Date().toISOString(),
      }));
    }
    records.forEach((record) => publish('room-ble-mesh', 'sos:received', record));
    return res.status(202).json({ data: records, synced: records.length });
  });
  api.get('/admin/sos', adminOnly, async (req, res) => res.json({ data: await store.list('beacons') }));
  api.get('/admin/stats', adminOnly, async (req, res) => {
    const [volunteers, incidents, shelters, directives] = await Promise.all(['volunteers', 'incidents', 'shelters', 'directives'].map((collection) => store.list(collection)));
    return res.json({ data: {
      pendingVolunteers: volunteers.filter((item) => item.status === 'pending').length,
      pendingIncidents: incidents.filter((item) => item.status === 'pending').length,
      availableShelterBeds: shelters.reduce((sum, item) => sum + Math.max(0, item.totalBeds - item.occupiedBeds), 0),
      activeDirectives: directives.filter((item) => item.active !== false).length,
    } });
  });

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}.` } }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) console.error(error);
    return res.status(statusCode).json({ error: { code: error.code ?? 'INTERNAL_ERROR', message: statusCode >= 500 ? 'An unexpected server error occurred.' : error.message } });
  });
  return app;
}
