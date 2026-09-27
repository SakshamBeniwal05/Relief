import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';

process.env.ADMIN_API_KEY = 'test-admin-key';
const store = await createStore({ databaseUrl: null });
const server = createServer(createApp({ store, aiEngineUrl: 'http://127.0.0.1:1' }));
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await store.close();
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers },
  });
  return { response, body: await response.json() };
}

test('health and public hazard feed are available', async () => {
  const health = await request('/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.body.storage, 'memory');

  const hazards = await request('/hazards');
  assert.equal(hazards.body.data.length, 3);
});

test('volunteer intake persists and admin can update its status', async () => {
  const submitted = await request('/volunteers', {
    method: 'POST',
    body: JSON.stringify({ fullName: 'Test Responder', mobile: '+91 98765 43210', specialization: 'Paramedic / Doctor' }),
  });
  assert.equal(submitted.response.status, 201);
  assert.equal(submitted.body.data.status, 'pending');

  const denied = await request('/admin/volunteers');
  assert.equal(denied.response.status, 401);

  const list = await request('/admin/volunteers', { headers: { authorization: 'Bearer test-admin-key' } });
  const applicant = list.body.data.find((item) => item.id === submitted.body.data.id);
  assert.equal(applicant.name, 'Test Responder');

  const updated = await request(`/admin/volunteers/${applicant.id}`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer test-admin-key' },
    body: JSON.stringify({ status: 'approved' }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.status, 'approved');
});

test('incident report is hidden until moderation, then appears in nearby feed', async () => {
  const submitted = await request('/incidents', {
    method: 'POST',
    body: JSON.stringify({ targetSector: 'Joshimath', observationNotes: 'Fresh rockfall observed.', location: '30.5562° N, 79.5638° E' }),
  });
  assert.equal(submitted.response.status, 201);
  assert.equal(submitted.body.data.status, 'pending');

  const moderated = await request(`/admin/incidents/${submitted.body.data.id}`, {
    method: 'PATCH',
    headers: { authorization: 'Bearer test-admin-key' },
    body: JSON.stringify({ status: 'verified' }),
  });
  assert.equal(moderated.response.status, 200);

  const nearby = await request('/incidents/nearby?lat=30.556&lng=79.563&radius=1000');
  assert.ok(nearby.body.data.some((item) => item.id === submitted.body.data.id));
});

test('evidence rejects spoofed coordinates and SOS packets sync', async () => {
  const incident = await request('/incidents', {
    method: 'POST',
    body: JSON.stringify({ targetSector: 'Pipalkoti', observationNotes: 'Debris on road.', latitude: 30.429, longitude: 79.33 }),
  });
  const spoofed = await request(`/incidents/${incident.body.data.id}/evidence`, {
    method: 'POST',
    body: JSON.stringify({ photoUrl: 'https://example.test/photo.jpg', exifLatitude: 30.429, exifLongitude: 79.33, browserLatitude: 30.5, browserLongitude: 79.5, capturedAtUtc: new Date().toISOString() }),
  });
  assert.equal(spoofed.response.status, 422);
  assert.equal(spoofed.body.error.code, 'SPOOFED_LOCATION_PRANK');

  const sos = await request('/sos/sync', {
    method: 'POST',
    body: JSON.stringify({ packets: [{ deviceHash: 'device-test', latitude: 30.5, longitude: 79.5, payloadText: 'Need drinking water', hopsCount: 2 }] }),
  });
  assert.equal(sos.response.status, 202);
  assert.equal(sos.body.synced, 1);
});

test('nearest shelter uses available capacity', async () => {
  const route = await request('/routes/nearest-shelter?lat=30.55&lng=79.56');
  assert.equal(route.response.status, 200);
  assert.ok(route.body.data.shelter.totalBeds > route.body.data.shelter.occupiedBeds);
  assert.equal(route.body.data.geometry.type, 'LineString');
});

test('district telemetry is available to prediction clients', async () => {
  const response = await request('/districts/telemetry');
  assert.equal(response.response.status, 200);
  assert.equal(response.body.data.length, 6);
  assert.ok(response.body.data.some((record) => record.district === 'Chamoli'));
  assert.ok(response.body.data.every((record) => record.dataKind === 'synthetic demo data'));
});

test('AI engine failure marks the job unavailable without affecting main API', async () => {
  const districts = await request('/districts/telemetry');
  const submitted = await request('/ai/jobs', {
    method: 'POST',
    body: JSON.stringify({ records: districts.body.data }),
  });
  assert.equal(submitted.response.status, 202);
  assert.equal(submitted.body.data.status, 'queued');

  let job;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = await request(`/ai/jobs/${submitted.body.data.id}`);
    job = result.body.data;
    if (job.status === 'engine_unavailable') break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(job.status, 'engine_unavailable');

  const health = await request('/health');
  const telemetry = await request('/districts/telemetry');
  const aiStatus = await request('/ai/status');
  assert.equal(health.body.status, 'ok');
  assert.equal(telemetry.response.status, 200);
  assert.equal(aiStatus.body.data.mainEngine, 'ok');
  assert.equal(aiStatus.body.data.aiEngine.status, 'offline');
});
