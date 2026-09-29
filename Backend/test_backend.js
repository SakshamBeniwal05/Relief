/**
 * SIH26191 Backend & AI Automated Verification Script
 */

import { calculateFactorOfSafety, calculateHazardScore, getAlertTier } from './src/ai/jevModel.js';
import { verifyIncidentEvidence } from './src/ai/antiPrankPipeline.js';
import { calculateDistanceKm, findNearestSafeShelters } from './src/services/spatialEngine.js';
import { store } from './src/data/store.js';

console.log('🧪 Starting SIH26191 Backend & AI Automated Verification...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. JEV Model Verification
console.log('--- 1. Testing JEV Geotechnical Slope Stability AI Model ---');
// Extreme rain & pore pressure in steep Joshimath slope (38 deg, 412 kPa pore pressure)
const criticalFos = calculateFactorOfSafety({ porePressure: 412, slopeTilt: 38, rainfall: 84 });
assert(criticalFos < 1.0, `Extreme pore pressure triggers FS < 1.0 (actual: ${criticalFos})`);

const criticalHazardScore = calculateHazardScore({
  factorOfSafety: criticalFos,
  soilSaturation: 92,
  rainfallMmh: 84,
});
assert(criticalHazardScore >= 80, `Critical Hazard Score >= 80 (actual: ${criticalHazardScore})`);

const criticalTier = getAlertTier(criticalFos, criticalHazardScore);
assert(criticalTier.alertLevel === 'CRITICAL', `Alert Tier is CRITICAL (actual: ${criticalTier.alertLevel})`);
assert(criticalTier.sec144Enforceable === true, 'Section 144 is enforceable in critical tier');

// Benign conditions in valley (pore pressure 40 kPa, slope 0 deg)
const benignFos = calculateFactorOfSafety({ porePressure: 40, slopeTilt: 0, rainfall: 5 });
assert(benignFos >= 2.0, `Benign flat terrain produces high FS (actual: ${benignFos})`);
const benignTier = getAlertTier(benignFos, 15);
assert(benignTier.alertLevel === 'NOMINAL', `Benign conditions produce NOMINAL tier`);

// 2. Anti-Prank Pipeline Verification
console.log('\n--- 2. Testing Anti-Prank Field Verification Pipeline ---');
const now = new Date();

// Genuine Case: Browser GPS matches EXIF within 10m, fresh timestamp
const genuineSubmission = verifyIncidentEvidence({
  browserCoords: { lat: 30.5512, lng: 79.5638 },
  exifCoords: { lat: 30.55125, lng: 79.56382 },
  capturedAtUtc: now.toISOString(),
  observationNotes: 'Major rockfall debris on Helang corridor road severed.',
});
assert(genuineSubmission.is_validated === true, 'Genuine submission is validated');
assert(genuineSubmission.verdict === 'VERIFIED_GENUINE', `Verdict is VERIFIED_GENUINE (actual: ${genuineSubmission.verdict})`);
assert(genuineSubmission.metrics.delta_distance_m < 15, `GPS Delta is within threshold (actual: ${genuineSubmission.metrics.delta_distance_m}m)`);

// Spoofing Case: EXIF coordinates 5km away from Browser GPS
const spoofedSubmission = verifyIncidentEvidence({
  browserCoords: { lat: 30.5512, lng: 79.5638 },
  exifCoords: { lat: 30.429, lng: 79.33 }, // Pipalkoti coords while claiming Helang
  capturedAtUtc: now.toISOString(),
  observationNotes: 'Fake photo report',
});
assert(spoofedSubmission.is_validated === false, 'Spoofed submission is rejected');
assert(spoofedSubmission.verdict === 'SPOOFED_LOCATION_PRANK', `Verdict is SPOOFED_LOCATION_PRANK (actual: ${spoofedSubmission.verdict})`);

// Historical Repost Case: Photo taken 1 hour ago
const staleSubmission = verifyIncidentEvidence({
  browserCoords: { lat: 30.5512, lng: 79.5638 },
  exifCoords: { lat: 30.5512, lng: 79.5638 },
  capturedAtUtc: new Date(Date.now() - 3600000).toISOString(),
  observationNotes: 'Old landslide photo repost',
});
assert(staleSubmission.is_validated === false, 'Stale timestamp is rejected');
assert(staleSubmission.verdict === 'HISTORICAL_REPOST', `Verdict is HISTORICAL_REPOST (actual: ${staleSubmission.verdict})`);

// 3. Spatial Computing Verification
console.log('\n--- 3. Testing Spatial Computing & Shelter Router ---');
const joshimathCoords = { lat: 30.556, lng: 79.563 };
const nearestShelters = findNearestSafeShelters(joshimathCoords.lat, joshimathCoords.lng, 3);
assert(nearestShelters.length > 0, `Found ${nearestShelters.length} nearest shelters`);
assert(nearestShelters[0].available_beds > 0, `Closest shelter has available beds (${nearestShelters[0].available_beds})`);
assert(nearestShelters[0].distance_km !== undefined, `Shelter has calculated distance (${nearestShelters[0].distance_km} km)`);

// 4. In-Memory Store Integrity
console.log('\n--- 4. Testing 10-Table In-Memory Store Integrity ---');
assert(store.locations.length >= 6, `Locations table populated (${store.locations.length})`);
assert(store.hazard_zones.length >= 3, `Hazard zones table populated (${store.hazard_zones.length})`);
assert(store.telemetry_logs.length >= 5, `Telemetry logs table populated (${store.telemetry_logs.length})`);
assert(store.incidents.length >= 3, `Incidents table populated (${store.incidents.length})`);
assert(store.habitations.length >= 3, `Habitations table populated (${store.habitations.length})`);
assert(store.shelters.length >= 3, `Shelters table populated (${store.shelters.length})`);
assert(store.government_timelines.length >= 2, `Government timelines table populated (${store.government_timelines.length})`);
assert(store.ble_mesh_beacons.length >= 2, `BLE mesh beacons table populated (${store.ble_mesh_beacons.length})`);
assert(store.volunteers.length >= 3, `Volunteers table populated (${store.volunteers.length})`);

console.log('\n--- 5. Testing Real-Time Multi-Disaster Ingestion Engine ---');
const { getLiveDisasterFeeds } = await import('./src/services/liveDisasterService.js');
const liveData = await getLiveDisasterFeeds();
assert(Array.isArray(liveData.disasters) && liveData.disasters.length > 0, `Live multi-disaster feeds aggregated (${liveData.disasters.length} active events)`);
assert(liveData.disasters[0].concentricRings.length === 4, '4-tier concentric heatmap rings generated for core-to-periphery impact');
assert(liveData.liveTelemetry !== null, 'Open-Meteo live atmospheric & JEV Mohr-Coulomb stability computed');

console.log('\n--- 6. Testing Dynamic Risk Zoning & Relocation Score Engine ---');
const { getDynamicRiskZoning, classifyRiskZone } = await import('./src/services/riskZoningService.js');

// Test 3-zone classification logic
const redZoneTest = classifyRiskZone({ factorOfSafety: 0.5, soilSaturationPct: 80, rainMmh: 25, porePressureKpa: 180 });
assert(redZoneTest.zone === 'RED', `Zone is RED for critical slope (actual: ${redZoneTest.zone})`);
assert(redZoneTest.riskScore >= 70, `Score is >= 70 for RED zone (actual: ${redZoneTest.riskScore})`);
assert(redZoneTest.relocationPreparedness === 'Prepare for Immediate Relocation', `Relocation action is Prepare for Immediate Relocation (actual: ${redZoneTest.relocationPreparedness})`);

const yellowZoneTest = classifyRiskZone({ factorOfSafety: 1.15, soilSaturationPct: 50, rainMmh: 10, porePressureKpa: 100 });
assert(yellowZoneTest.zone === 'YELLOW', `Zone is YELLOW for marginal slope (actual: ${yellowZoneTest.zone})`);
assert(yellowZoneTest.relocationPreparedness === 'Prepare & Monitor', `Relocation action is Prepare & Monitor (actual: ${yellowZoneTest.relocationPreparedness})`);

const greenZoneTest = classifyRiskZone({ factorOfSafety: 2.8, soilSaturationPct: 20, rainMmh: 0, porePressureKpa: 20 });
assert(greenZoneTest.zone === 'GREEN', `Zone is GREEN for safe terrace (actual: ${greenZoneTest.zone})`);
assert(greenZoneTest.riskScore < 40, `Score is < 40 for GREEN zone (actual: ${greenZoneTest.riskScore})`);
assert(greenZoneTest.relocationPreparedness === 'Normal Monitoring', `Relocation action is Normal Monitoring (actual: ${greenZoneTest.relocationPreparedness})`);

// Test live batch computation
const dynamicZoning = await getDynamicRiskZoning();
assert(Array.isArray(dynamicZoning.habitations) && dynamicZoning.habitations.length === 5, `Live habitations classified (${dynamicZoning.habitations.length} habitations)`);
assert(dynamicZoning.zonesSummary.redCount >= 1, `At least 1 Red Zone identified (${dynamicZoning.zonesSummary.redCount})`);
assert(dynamicZoning.habitations[0].priorityRank === 1, 'Top priority habitation is Rank 1 (RED ZONE)');

// 7. WebSocket Broadcast Verification
console.log('\n--- 7. Testing Real-Time WebSocket Broadcast & Alert Pipelines ---');
const { initWebSocketServer, broadcastWebSocket, getConnectedClientsCount } = await import('./src/services/websocketService.js');
import http from 'http';
const testServer = http.createServer();
const wss = initWebSocketServer(testServer);
assert(wss !== null, 'WebSocket server instantiated on HTTP server');
const delivered = broadcastWebSocket({ type: 'EMERGENCY_ALERT', payload: { test: true } });
assert(delivered >= 0, 'WebSocket broadcast execution completed safely');
assert(typeof getConnectedClientsCount() === 'number', 'Connected clients metric tracked');

console.log(`\n🏁 Verification Finished: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) process.exit(1);

