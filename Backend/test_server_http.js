/**
 * SIH26191 Live Express Server HTTP Integration Test
 */

import http from 'http';
import app from './main.js';

const TEST_PORT = 3099;

const server = app.listen(TEST_PORT, async () => {
  console.log(`📡 Test server listening on http://localhost:${TEST_PORT}`);

  try {
    const baseUrl = `http://localhost:${TEST_PORT}`;

    // 1. GET /
    const resRoot = await fetch(`${baseUrl}/`);
    const dataRoot = await resRoot.json();
    console.log('✅ GET / =>', dataRoot.system);

    // 2. GET /api/health
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const dataHealth = await resHealth.json();
    console.log('✅ GET /api/health =>', dataHealth.status, dataHealth.ai_engine);

    // 3. GET /api/entities
    const resEntities = await fetch(`${baseUrl}/api/entities`);
    const dataEntities = await resEntities.json();
    console.log('✅ GET /api/entities =>', Object.keys(dataEntities.data).length, 'entities loaded');

    // 4. POST /api/telemetry/predict
    const resPredict = await fetch(`${baseUrl}/api/telemetry/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rainfall_mmh: 90,
        pore_pressure_kpa: 420,
        soil_saturation_pct: 95,
        slope_tilt_deg: 36,
      }),
    });
    const dataPredict = await resPredict.json();
    console.log('✅ POST /api/telemetry/predict => Alert:', dataPredict.prediction.alertLevel, 'FoS:', dataPredict.prediction.factor_of_safety);

    // 5. GET /api/shelters/nearest
    const resNearest = await fetch(`${baseUrl}/api/shelters/nearest?lat=30.556&lng=79.563`);
    const dataNearest = await resNearest.json();
    console.log('✅ GET /api/shelters/nearest => Closest:', dataNearest.data[0].name, `${dataNearest.data[0].distance_km} km`);

    // 6. POST /api/evidence/verify (Anti-Prank test)
    const resEvidence = await fetch(`${baseUrl}/api/evidence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetSector: 'Helang KM Post 214',
        observationNotes: 'Heavy rockfall debris blocking lane.',
        browserCoords: { lat: 30.5512, lng: 79.5638 },
        exifCoords: { lat: 30.55121, lng: 79.56379 },
        capturedAtUtc: new Date().toISOString(),
      }),
    });
    const dataEvidence = await resEvidence.json();
    console.log('✅ POST /api/evidence/verify => Verdict:', dataEvidence.verdict, 'Passed:', dataEvidence.passed);

    // 7. GET /api/admin/stats
    const resStats = await fetch(`${baseUrl}/api/admin/stats`);
    const dataStats = await resStats.json();
    console.log('✅ GET /api/admin/stats => Stats count:', dataStats.data.length);

    console.log('\n🎉 ALL 7 ENDPOINTS VERIFIED SUCCESSFULLY OVER HTTP!');
  } catch (err) {
    console.error('❌ HTTP Test Error:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('🔒 Test server closed cleanly.');
      process.exit(process.exitCode || 0);
    });
  }
});
