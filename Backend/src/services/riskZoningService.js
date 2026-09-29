/**
 * SIH26191 - Dynamic Risk Zoning & Relocation Score Engine
 * 
 * 3-Zone Classification System:
 * - RED ZONE    -> HIGH RISK     -> Prepare for Immediate Relocation (0 - 3M)
 * - YELLOW ZONE -> MODERATE RISK -> Prepare & Monitor (3 - 12M)
 * - GREEN ZONE  -> LOW RISK      -> Normal Monitoring (Safe / 1 - 3Y)
 * 
 * Replaces static demo data by computing the 0 - 100 Risk Score in real time from:
 * 1. Live Open-Meteo precipitation, rain intensity, and subsurface soil moisture
 * 2. Live GloFAS Alaknanda river discharge surge
 * 3. Live USGS Himalayan seismic events (Peak Ground Acceleration effect)
 * 4. Geotechnical infinite slope stability Factor of Safety (Mohr-Coulomb failure model)
 */

import { calculateFactorOfSafety } from '../ai/jevModel.js';

// Monitored Himalayan Habitations and Resettlement Sectors
export const MONITORED_HABITATIONS = [
  {
    id: 'joshimath',
    name: 'Joshimath Ravigram Sector',
    district: 'Chamoli',
    coordinates: { lat: 30.556, lng: 79.563 },
    slopeAngleDeg: 36.0,
    soilCohesionKpa: 14.0,
    failureDepthM: 3.8,
    affectedFamilies: 412,
    structuresRedFlagged: 68,
    isRiverToeSector: false,
    baseGeology: 'Weathered Gneiss & Colluvial Debris',
  },
  {
    id: 'sunil_ward',
    name: 'Sunil Ward Upper Terrace',
    district: 'Chamoli',
    coordinates: { lat: 30.560, lng: 79.570 },
    slopeAngleDeg: 33.5,
    soilCohesionKpa: 17.5,
    failureDepthM: 3.2,
    affectedFamilies: 630,
    structuresRedFlagged: 34,
    isRiverToeSector: false,
    baseGeology: 'Glacial Till & Unconsolidated Talus',
  },
  {
    id: 'pipalkoti',
    name: 'Pipalkoti North Corridor',
    district: 'Chamoli',
    coordinates: { lat: 30.429, lng: 79.330 },
    slopeAngleDeg: 24.0,
    soilCohesionKpa: 22.0,
    failureDepthM: 2.5,
    affectedFamilies: 180,
    structuresRedFlagged: 12,
    isRiverToeSector: true,
    baseGeology: 'Dolomite & Quartzite Fluvial Terrace',
  },
  {
    id: 'chamoli_km214',
    name: 'Chamoli NH-58 KM 214 Road Slip',
    district: 'Chamoli',
    coordinates: { lat: 30.512, lng: 79.521 },
    slopeAngleDeg: 38.0,
    soilCohesionKpa: 12.0,
    failureDepthM: 4.2,
    affectedFamilies: 95,
    structuresRedFlagged: 19,
    isRiverToeSector: true,
    baseGeology: 'Steep Toe Scarp Over Alaknanda',
  },
  {
    id: 'gauchar_safe',
    name: 'Gauchar Alluvial Tableland',
    district: 'Chamoli',
    coordinates: { lat: 30.291, lng: 79.155 },
    slopeAngleDeg: 7.0,
    soilCohesionKpa: 35.0,
    failureDepthM: 1.5,
    affectedFamilies: 0,
    structuresRedFlagged: 0,
    isRiverToeSector: false,
    baseGeology: 'Broad Flat River Terrace (Safe Resettlement Site)',
  },
];

let cachedRiskZoning = null;
let lastRiskFetch = 0;
const RISK_CACHE_TTL_MS = 45 * 1000; // 45s cache

/**
 * Calculates real-time 0 - 100 Dynamic Risk Score and 3-Zone Classification
 */
export function classifyRiskZone({
  factorOfSafety,
  soilSaturationPct,
  rainMmh,
  porePressureKpa,
  nearbyQuakeMag = 0,
  quakeDistanceKm = 9999,
  riverDischargeM3s = 80,
}) {
  // 1. FoS component (0 to 60 points)
  let fosPoints = 0;
  if (factorOfSafety < 1.0) {
    // Sharp non-linear escalation for critical slope shear
    fosPoints = 42.0 + Math.min(18.0, (1.0 - factorOfSafety) * 35.0);
  } else if (factorOfSafety < 1.3) {
    // Marginal stability
    fosPoints = 22.0 + (1.3 - factorOfSafety) * 60.0;
  } else {
    // Stable slope
    fosPoints = Math.max(0, (2.2 - factorOfSafety) * 12.0);
  }

  // 2. Soil Saturation component (0 to 18 points)
  const satPoints = (Math.min(soilSaturationPct, 100.0) / 100.0) * 18.0;

  // 3. Live Rain rate component (0 to 12 points)
  const rainPoints = (Math.min(rainMmh, 80.0) / 80.0) * 12.0;

  // 4. Seismic Shake factor from live USGS Earthquakes (0 to 15 points)
  let seismicPoints = 0;
  if (quakeDistanceKm < 500 && nearbyQuakeMag >= 3.0) {
    const proximityWeight = Math.max(0, (500 - quakeDistanceKm) / 500);
    seismicPoints = proximityWeight * (nearbyQuakeMag / 6.0) * 15.0;
  }

  // 5. River Flooding Surge factor from live GloFAS (0 to 10 points)
  let floodPoints = 0;
  if (riverDischargeM3s > 90) {
    floodPoints = Math.min(10.0, ((riverDischargeM3s - 90) / 60.0) * 10.0);
  }

  const rawScore = fosPoints + satPoints + rainPoints + seismicPoints + floodPoints;
  const riskScore = Number(Math.min(100.0, Math.max(2.0, rawScore)).toFixed(1));

  // 3-ZONE CLASSIFICATION
  let zone;
  let riskLevel;
  let relocationPreparedness;
  let priorityRank;
  let actionProtocol;
  let color;
  let badgeClass;

  if (riskScore >= 70.0 || factorOfSafety < 1.0) {
    zone = 'RED';
    riskLevel = 'HIGH RISK';
    relocationPreparedness = 'Prepare for Immediate Relocation';
    priorityRank = 1;
    actionProtocol =
      'Immediate Section 144 Enforced. Rapid relocation queue #1 active (0-3 Months). Issue priority replacement land plot token and execute immediate ₹1.5L ex-gratia DBT transfer.';
    color = '#D32F2F';
    badgeClass = 'bg-error text-white';
  } else if (riskScore >= 40.0 || factorOfSafety < 1.3) {
    zone = 'YELLOW';
    riskLevel = 'MODERATE RISK';
    relocationPreparedness = 'Prepare & Monitor';
    priorityRank = 2;
    actionProtocol =
      'Continuous sensor telemetry monitoring & acoustic crack logging. Phased relocation preparedness (3-12 Months). Enforce physical document submission at Tehsil Desk #3 and ready emergency kits.';
    color = '#ED6C02';
    badgeClass = 'bg-amber-500 text-white';
  } else {
    zone = 'GREEN';
    riskLevel = 'LOW RISK';
    relocationPreparedness = 'Normal Monitoring';
    priorityRank = 3;
    actionProtocol =
      'Normal civic and commercial monitoring. Designate safe transit shelters and reception staging areas for evacuees from Red zones.';
    color = '#2E7D32';
    badgeClass = 'bg-[#2e7d32] text-white';
  }

  return {
    riskScore,
    zone,
    riskLevel,
    relocationPreparedness,
    priorityRank,
    actionProtocol,
    color,
    badgeClass,
    components: {
      fosPoints: Number(fosPoints.toFixed(1)),
      satPoints: Number(satPoints.toFixed(1)),
      rainPoints: Number(rainPoints.toFixed(1)),
      seismicPoints: Number(seismicPoints.toFixed(1)),
      floodPoints: Number(floodPoints.toFixed(1)),
    },
  };
}

/**
 * Calculates live distance between two coordinates in kilometers (Haversine)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetches real live multi-location weather and evaluates dynamic risk zones
 */
export async function getDynamicRiskZoning() {
  const now = Date.now();
  if (cachedRiskZoning && now - lastRiskFetch < RISK_CACHE_TTL_MS) {
    return cachedRiskZoning;
  }

  // 1. Fetch real-time multi-location weather from Open-Meteo
  const lats = MONITORED_HABITATIONS.map((h) => h.coordinates.lat).join(',');
  const lngs = MONITORED_HABITATIONS.map((h) => h.coordinates.lng).join(',');
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&hourly=soil_moisture_0_to_1cm&forecast_days=1`;

  // 2. Fetch live USGS earthquakes in South Asia
  const quakeUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&latitude=28.0&longitude=79.0&maxradiuskm=2500&limit=10`;

  // 3. Fetch live GloFAS Alaknanda river discharge
  const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=30.55&longitude=79.56&daily=river_discharge`;

  let weatherList = [];
  let quakes = [];
  let riverDischarge = 85.0;

  try {
    const [wRes, qRes, fRes] = await Promise.all([
      fetch(weatherUrl, { signal: AbortSignal.timeout(5000) }),
      fetch(quakeUrl, { signal: AbortSignal.timeout(5000) }),
      fetch(floodUrl, { signal: AbortSignal.timeout(5000) }),
    ]);

    if (wRes.ok) {
      const wData = await wRes.json();
      weatherList = Array.isArray(wData) ? wData : [wData];
    }
    if (qRes.ok) {
      const qData = await qRes.json();
      quakes = qData.features || [];
    }
    if (fRes.ok) {
      const fData = await fRes.json();
      riverDischarge = Number(fData.daily?.river_discharge?.[0] || 85.0);
    }
  } catch (err) {
    console.warn('[RiskZoningService] Live fetch error:', err.message);
  }

  // Evaluate each habitation with real live inputs
  const habitationsWithScores = MONITORED_HABITATIONS.map((hab, index) => {
    const weather = weatherList[index] || {};
    const rainMmh = Number(weather.current?.rain || weather.current?.precipitation || 0);
    const tempC = Number(weather.current?.temperature_2m || 18.0);
    const humidity = Number(weather.current?.relative_humidity_2m || 60);
    const soilMoistureVol = Number(weather.hourly?.soil_moisture_0_to_1cm?.[12] || 0.32);
    const soilSatPct = Math.round(soilMoistureVol * 250); // e.g. 0.32 -> 80%

    // Subsurface pore pressure calibrated by live rainfall and soil saturation
    const livePorePressure = 80.0 + rainMmh * 5.0 + (soilSatPct > 75 ? 35.0 : 0);

    // Compute live Mohr-Coulomb Factor of Safety (FS)
    const factorOfSafety = calculateFactorOfSafety({
      porePressure: livePorePressure,
      slopeTilt: hab.slopeAngleDeg,
      cohesion: hab.soilCohesionKpa,
      failureDepth: hab.failureDepthM,
      rainfall: rainMmh,
    });

    // Find nearest live earthquake and compute distance
    let nearestQuakeMag = 0;
    let minQuakeDist = 9999;
    for (const q of quakes) {
      const qLat = q.geometry?.coordinates?.[1];
      const qLng = q.geometry?.coordinates?.[0];
      const mag = q.properties?.mag || 0;
      if (qLat && qLng) {
        const dist = calculateDistanceKm(hab.coordinates.lat, hab.coordinates.lng, qLat, qLng);
        if (dist < minQuakeDist) {
          minQuakeDist = dist;
          nearestQuakeMag = mag;
        }
      }
    }

    const classification = classifyRiskZone({
      factorOfSafety,
      soilSaturationPct: soilSatPct,
      rainMmh,
      porePressureKpa: livePorePressure,
      nearbyQuakeMag: nearestQuakeMag,
      quakeDistanceKm: minQuakeDist,
      riverDischargeM3s: hab.isRiverToeSector ? riverDischarge : 40,
    });

    return {
      ...hab,
      liveTelemetry: {
        tempC,
        rainMmh,
        humidity,
        soilMoistureVol,
        soilSatPct,
        porePressureKpa: livePorePressure,
        factorOfSafety,
        riverDischargeM3s: riverDischarge,
        nearestQuake:
          minQuakeDist < 2000
            ? {
                magnitude: nearestQuakeMag,
                distanceKm: Math.round(minQuakeDist),
              }
            : null,
      },
      ...classification,
    };
  });

  // Sort by priority rank (Red Zone first, then Yellow, then Green) and then riskScore descending
  habitationsWithScores.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return b.riskScore - a.riskScore;
  });

  cachedRiskZoning = {
    updatedAt: new Date().toISOString(),
    zonesSummary: {
      redCount: habitationsWithScores.filter((h) => h.zone === 'RED').length,
      yellowCount: habitationsWithScores.filter((h) => h.zone === 'YELLOW').length,
      greenCount: habitationsWithScores.filter((h) => h.zone === 'GREEN').length,
    },
    liveDisasterContext: {
      liveRiverDischargeM3s: riverDischarge,
      activeQuakesSampled: quakes.length,
      source: 'Open-Meteo Weather + GloFAS Flood + USGS Earthquakes Live Feeds',
    },
    habitations: habitationsWithScores,
  };
  lastRiskFetch = now;

  return cachedRiskZoning;
}
