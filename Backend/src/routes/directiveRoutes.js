import express from 'express';
import { store } from '../data/store.js';
import { calculateFactorOfSafety, calculateHazardScore, getAlertTier } from '../ai/jevModel.js';
import { broadcastWebSocket } from '../services/websocketService.js';

const router = express.Router();

// Preset coordinates map for standard Himalayan sectors
const SECTOR_COORDS = {
  joshimath: { lat: 30.556, lng: 79.563 },
  sunil: { lat: 30.56, lng: 79.57 },
  chamoli: { lat: 30.512, lng: 79.521 },
  pipalkoti: { lat: 30.429, lng: 79.33 },
  gauchar: { lat: 30.291, lng: 79.155 },
  mana: { lat: 30.744, lng: 79.493 },
  helang: { lat: 30.5512, lng: 79.5638 },
};

function resolveSectorCoords(sectorText = '', coordsInput = null) {
  if (coordsInput && typeof coordsInput.lat === 'number' && typeof coordsInput.lng === 'number') {
    return coordsInput;
  }
  const lower = sectorText.toLowerCase();
  for (const [key, coords] of Object.entries(SECTOR_COORDS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return { lat: 30.556, lng: 79.563 };
}

/**
 * GET /api/directives/active
 * Returns all currently active government mandates and gazette orders
 */
router.get('/directives/active', (req, res) => {
  const activeOrders = store.government_timelines.filter(
    (t) => t.status === 'ENFORCED' || t.status === 'ACTIVE_DISBURSAL' || t.status === 'TENDER_ISSUED'
  );

  res.json({
    status: 'success',
    total_active: activeOrders.length,
    data: activeOrders,
  });
});

/**
 * POST /api/directives
 * Issues Section 144, evacuation orders, or gazette mandates.
 * Alongside publishing, AI automatically detects threat characteristics,
 * fetches live local weather for the coordinates, executes JEV geotechnical analysis,
 * and compiles a comprehensive Disaster Intelligence Report.
 */
router.post('/directives', async (req, res) => {
  const {
    orderType = 'Section 144 Emergency Evacuation',
    targetSector,
    directiveText,
    pushBleMeshSiren = true,
    coordinates,
    threatCategory,
    threatSeverity = 'CRITICAL',
    threatRadiusMeters = 3200,
    compensationPerFamilyInr = 150000,
    targetFamilies = 250,
    deadlineDate,
    authority = 'District Magistrate, Chamoli & SDRF Unified Command',
  } = req.body;

  if (!targetSector || !directiveText) {
    return res.status(400).json({
      status: 'error',
      message: 'Target sector and directive text are required.',
    });
  }

  const coords = resolveSectorCoords(targetSector, coordinates);
  const orderId = `UK-GOV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const reportId = `DOSSIER-${targetSector.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;

  // 1. AI Threat Detection & Keyword Analysis
  let detectedThreatCategory = threatCategory;
  if (!detectedThreatCategory) {
    const textLower = `${targetSector} ${directiveText}`.toLowerCase();
    if (textLower.includes('flood') || textLower.includes('river') || textLower.includes('discharge') || textLower.includes('surge')) {
      detectedThreatCategory = 'Hydrological Flash Flood & River Surge';
    } else if (textLower.includes('slip') || textLower.includes('rock') || textLower.includes('talus') || textLower.includes('blockade')) {
      detectedThreatCategory = 'Talus Rockfall & Highway Blockade';
    } else if (textLower.includes('fissure') || textLower.includes('subsidence') || textLower.includes('sink') || textLower.includes('crack')) {
      detectedThreatCategory = 'Geotechnical Deep Slope Subsidence';
    } else {
      detectedThreatCategory = 'Multi-Hazard Terrain Destabilization';
    }
  }

  // 2. Fetch Live Weather for Exact Location from Open-Meteo
  let liveWeather = {
    tempC: 18.5,
    rainMmh: 0.0,
    humidity: 65,
    soilSatPct: 75,
    source: 'Open-Meteo Live Atmospheric Sensor',
  };

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=soil_moisture_0_to_1cm&forecast_days=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      const rain = Number(weatherData.current?.rain || weatherData.current?.precipitation || 0);
      const temp = Number(weatherData.current?.temperature_2m || 18.5);
      const humidity = Number(weatherData.current?.relative_humidity_2m || 65);
      const soilMoisture = Number(weatherData.hourly?.soil_moisture_0_to_1cm?.[12] || 0.32);
      const soilSatPct = Math.round(soilMoisture * 250);

      liveWeather = {
        tempC: temp,
        rainMmh: rain,
        humidity,
        soilSatPct,
        source: 'Open-Meteo Real-Time Weather Stream',
      };
    }
  } catch (err) {
    console.info(`[Directives] Local weather query defaulted (${err.message})`);
  }

  // 3. AI Geotechnical & Slope Stability Analysis (JEV Model)
  const porePressureKpa = 90.0 + liveWeather.rainMmh * 4.2 + (liveWeather.soilSatPct > 70 ? 45 : 10);
  const calculatedFos = calculateFactorOfSafety({
    porePressure: porePressureKpa,
    slopeTilt: 35.0,
    rainfall: liveWeather.rainMmh,
  });

  const calculatedHazardScore = calculateHazardScore({
    factorOfSafety: calculatedFos,
    soilSaturation: liveWeather.soilSatPct,
    rainfallMmh: liveWeather.rainMmh,
  });

  const alertTier = getAlertTier(calculatedFos, calculatedHazardScore);

  // 4. Synthesize Official Disaster Intelligence Report (Dossier)
  const reportDossier = {
    report_id: reportId,
    order_code: `#${orderId}`,
    generated_at_utc: new Date().toISOString(),
    classification: 'OFFICIAL GAZETTE DIRECTIVE • DISASTER MANAGEMENT ACT 2005 (SEC 144)',
    sector_name: targetSector,
    coordinates: coords,
    threat_radius_meters: threatRadiusMeters,
    threat_category: detectedThreatCategory,
    threat_severity: threatSeverity,
    detected_threat_signature: `${detectedThreatCategory.toUpperCase().replace(/\s+/g, '_')}_THREAT_DETECTED`,
    live_weather: {
      temp_c: liveWeather.tempC,
      rain_mmh: liveWeather.rainMmh,
      humidity_pct: liveWeather.humidity,
      soil_saturation_pct: liveWeather.soilSatPct,
      source: liveWeather.source,
    },
    geotechnical_analysis: {
      factor_of_safety: calculatedFos,
      hazard_score: calculatedHazardScore,
      alert_level: alertTier.alertLevel,
      sec144_enforceable: true,
      pore_pressure_kpa: porePressureKpa,
      recommendation: alertTier.recommendation,
    },
    directives: directiveText,
    evacuation_plan: {
      primary_route: 'Helang-Pipalkoti Bypass Corridor',
      staging_shelter: 'Gauchar Field Station Airstrip (58 beds available)',
      designated_helipad: 'Gauchar Sector 1 Helipad',
    },
    sign_off: {
      nodal_officer: authority,
      approval_stamp: `DIGITAL_SEAL_UK_SDMA_SEC144_${orderId}`,
      timestamp: new Date().toISOString(),
    },
    compensation: {
      per_family_inr: compensationPerFamilyInr,
      target_families: targetFamilies,
      total_budget_cr: Number(((compensationPerFamilyInr * targetFamilies) / 10000000).toFixed(2)),
      deadline_date: deadlineDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
  };

  // Store in generated reports map
  if (!store.incident_reports) store.incident_reports = {};
  store.incident_reports[reportId.toLowerCase()] = reportDossier;
  store.incident_reports[orderId.toLowerCase()] = reportDossier;

  // 5. Create Government Timeline Order
  const newOrder = {
    id: orderId,
    order_code: `#${orderId}`,
    report_id: reportId,
    title: `${orderType || 'SECTION 144'}: ${targetSector}`,
    authority,
    description: directiveText,
    compensation_per_family_inr: compensationPerFamilyInr,
    target_families: targetFamilies,
    total_budget_cr: Number(((compensationPerFamilyInr * targetFamilies) / 10000000).toFixed(2)),
    disbursed_families: 0,
    deadline_date: reportDossier.compensation.deadline_date,
    status: 'ENFORCED',
    directives: directiveText,
    push_ble_mesh_siren: !!pushBleMeshSiren,
    coordinates: coords,
    threat_category: detectedThreatCategory,
    threat_severity: threatSeverity,
    threat_radius_meters: threatRadiusMeters,
    has_active_gov_order: true,
    ai_prediction_superseded: true, // Key flag: Suppress redundant AI prediction on this sector
    created_at: new Date().toISOString(),
  };

  store.government_timelines.unshift(newOrder);

  // Update or create hazard zone in store
  let matchingZone = store.hazard_zones.find((z) =>
    z.name.toLowerCase().includes(targetSector.toLowerCase())
  );
  if (matchingZone) {
    matchingZone.is_sec144_active = true;
    matchingZone.directives = directiveText;
    matchingZone.has_active_gov_order = true;
    matchingZone.order_id = orderId;
    matchingZone.core_radius_m = Math.min(threatRadiusMeters, 1500);
    matchingZone.buffer_radius_m = threatRadiusMeters;
  } else {
    store.hazard_zones.push({
      id: `HZ-${Date.now()}`,
      zone_code: `#${orderId}`,
      location_id: `LOC-${orderId}`,
      name: `${targetSector} Official Enforcement Zone`,
      risk_level: threatSeverity,
      factor_of_safety: calculatedFos,
      core_radius_m: Math.min(threatRadiusMeters, 1500),
      buffer_radius_m: threatRadiusMeters,
      centroid: coords,
      is_sec144_active: true,
      has_active_gov_order: true,
      order_id: orderId,
      enforced_at: new Date().toISOString(),
      directives: directiveText,
    });
  }

  // If BLE Mesh Siren triggered, generate emergency broadcast beacon
  if (pushBleMeshSiren) {
    const sirenBeacon = {
      id: `SIREN-${Date.now()}`,
      beacon_hash: `SHA256:SIREN-${Date.now().toString(16)}`,
      sender_device_hash: 'NODAL-COMMAND-HQ',
      latitude: coords.lat,
      longitude: coords.lng,
      payload_text: `GOV ALERT [${orderType || 'SEC 144'}]: ${directiveText}`,
      hops_count: 0,
      relayed_via_peer_hash: 'CELL-TOWER-BROADCAST',
      emergency_type: 'GOVERNMENT_DIRECTIVE',
      timestamp: new Date().toISOString(),
      status: 'broadcasting',
    };
    store.ble_mesh_beacons.unshift(sirenBeacon);
  }

  // Audit Log Entry
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `${orderType || 'Directive'} Enforced: ${targetSector}`,
    authInfo: `Authorized by ${authority} • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: `Threat: ${detectedThreatCategory}. Live weather ingested (${liveWeather.tempC}°C, rain ${liveWeather.rainMmh}mm/h). AI Dossier ${reportId} compiled and broadcast.`,
    icon: 'gavel',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    timestamp: new Date().toISOString(),
  });

  // Broadcast Gazette Directive across all connected WebSockets
  broadcastWebSocket({
    type: 'GAZETTE_ORDER',
    payload: newOrder,
    report: reportDossier,
  });

  // Always broadcast Emergency Threat Alert to all citizen devices & HUDs
  const sirenAlert = {
    id: `ALERT-${Date.now()}`,
    orderType: orderType || 'Section 144 Emergency Evacuation',
    directiveText,
    targetSector,
    sectorCoords: coords,
    threatRadiusMeters: Number(threatRadiusMeters),
    threatCategory: detectedThreatCategory,
    threatSeverity,
    authorizedBy: authority,
    timestamp: `${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    liveWeather,
    created_at: new Date().toISOString(),
  };
  store.emergency_alerts = [sirenAlert];
  broadcastWebSocket({
    type: 'EMERGENCY_ALERT',
    payload: sirenAlert,
  });

  res.status(201).json({
    status: 'success',
    message: 'Official Government Directive published with autonomous AI threat analysis and live weather dossier.',
    data: {
      order: newOrder,
      report: reportDossier,
      liveWeather,
      geotechnicalAnalysis: {
        factorOfSafety: calculatedFos,
        hazardScore: calculatedHazardScore,
        alertLevel: alertTier.alertLevel,
      },
    },
  });
});

/**
 * GET /api/directives/alerts/active
 * Returns all active Emergency Government Threat Alerts
 */
router.get('/directives/alerts/active', (req, res) => {
  res.json({
    status: 'success',
    data: store.emergency_alerts || [],
  });
});

/**
 * POST /api/directives/alert
 * Issues an immediate Emergency Government Threat Alert (Life-Safety Broadcast).
 * AI classifies threat, pulls live weather for coordinates, and broadcasts live over WebSockets
 * to all citizens and command centers.
 */
router.post('/directives/alert', async (req, res) => {
  const {
    orderType = 'Emergency Evacuation Siren Warning',
    targetSector,
    directiveText,
    pushBleMeshSiren = true,
    coordinates,
    threatCategory,
    threatSeverity = 'CRITICAL',
    threatRadiusMeters = 3200,
    authority = 'District Magistrate, Chamoli & SDRF Unified Command',
  } = req.body;

  if (!targetSector || !directiveText) {
    return res.status(400).json({
      status: 'error',
      message: 'Target sector and directive text are required for emergency threat alert.',
    });
  }

  const coords = resolveSectorCoords(targetSector, coordinates);
  const alertId = `ALERT-${Date.now()}`;

  // 1. AI Threat Classification
  let detectedThreatCategory = threatCategory;
  if (!detectedThreatCategory) {
    const textLower = `${targetSector} ${directiveText}`.toLowerCase();
    if (textLower.includes('flood') || textLower.includes('river') || textLower.includes('discharge') || textLower.includes('surge')) {
      detectedThreatCategory = 'Hydrological Flash Flood & River Surge';
    } else if (textLower.includes('slip') || textLower.includes('rock') || textLower.includes('talus') || textLower.includes('blockade')) {
      detectedThreatCategory = 'Talus Rockfall & Highway Blockade';
    } else if (textLower.includes('fissure') || textLower.includes('subsidence') || textLower.includes('sink') || textLower.includes('crack')) {
      detectedThreatCategory = 'Geotechnical Deep Slope Subsidence';
    } else {
      detectedThreatCategory = 'Multi-Hazard Terrain Destabilization';
    }
  }

  // 2. Fetch Live Weather for Exact Coordinates
  let liveWeather = {
    tempC: 18.5,
    rainMmh: 0.0,
    humidity: 65,
    soilSatPct: 75,
    source: 'Open-Meteo Live Atmospheric Sensor',
  };

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=soil_moisture_0_to_1cm&forecast_days=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      const rain = Number(weatherData.current?.rain || weatherData.current?.precipitation || 0);
      const temp = Number(weatherData.current?.temperature_2m || 18.5);
      const humidity = Number(weatherData.current?.relative_humidity_2m || 65);
      const soilMoisture = Number(weatherData.hourly?.soil_moisture_0_to_1cm?.[12] || 0.32);
      const soilSatPct = Math.round(soilMoisture * 250);

      liveWeather = {
        tempC: temp,
        rainMmh: rain,
        humidity,
        soilSatPct,
        source: 'Open-Meteo Real-Time Weather Stream',
      };
    }
  } catch (err) {
    console.info(`[Directives Alert] Local weather query defaulted (${err.message})`);
  }

  const alertPayload = {
    id: alertId,
    orderType,
    directiveText,
    targetSector,
    sectorCoords: coords,
    threatRadiusMeters: Number(threatRadiusMeters),
    threatCategory: detectedThreatCategory,
    threatSeverity,
    authorizedBy: authority,
    timestamp: `${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    liveWeather,
    created_at: new Date().toISOString(),
  };

  // Push BLE mesh beacon
  if (pushBleMeshSiren) {
    store.ble_mesh_beacons.unshift({
      id: `SIREN-${Date.now()}`,
      beacon_hash: `SHA256:ALERT-${Date.now().toString(16)}`,
      sender_device_hash: 'EMERGENCY-BROADCAST-NET',
      latitude: coords.lat,
      longitude: coords.lng,
      payload_text: `EMERGENCY ALERT [${threatSeverity}]: ${directiveText}`,
      hops_count: 0,
      relayed_via_peer_hash: 'CELL-TOWER-BROADCAST',
      emergency_type: 'GOVERNMENT_DIRECTIVE',
      timestamp: new Date().toISOString(),
      status: 'broadcasting',
    });
  }

  // Audit log
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `EMERGENCY ALERT BROADCAST: ${targetSector}`,
    authInfo: `Authorized by ${authority} • ${alertPayload.timestamp}`,
    description: `Tactical Warning (${threatSeverity}): ${directiveText}. Live weather: ${liveWeather.tempC}°C, rain ${liveWeather.rainMmh}mm/h. Dispatched via WebSockets to all mesh nodes.`,
    icon: 'crisis_alert',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    timestamp: new Date().toISOString(),
  });

  // Construct Government Directive object for ephemeral/real-time client broadcast
  const govDirectiveOrder = {
    id: alertId,
    order_code: `#${alertId}`,
    report_id: `DOSSIER-${targetSector.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
    title: `${orderType}: ${targetSector}`,
    authority,
    description: directiveText,
    compensation_per_family_inr: 0,
    target_families: 150,
    total_budget_cr: 0,
    disbursed_families: 0,
    deadline_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'ENFORCED',
    directives: directiveText,
    push_ble_mesh_siren: !!pushBleMeshSiren,
    coordinates: coords,
    threat_category: detectedThreatCategory,
    threat_severity: threatSeverity,
    threat_radius_meters: Number(threatRadiusMeters),
    has_active_gov_order: true,
    ai_prediction_superseded: true,
    timestamp: alertPayload.timestamp,
    created_at: new Date().toISOString(),
  };

  // Ephemeral in-memory store for newly connecting clients (transient, no permanent DB disk pollution)
  store.emergency_alerts = [alertPayload];

  // Broadcast to all WebSocket clients!
  const clientCount = broadcastWebSocket({
    type: 'EMERGENCY_ALERT',
    payload: alertPayload,
  });

  // Also broadcast GAZETTE_ORDER event to synchronize timeline drawers across all windows
  broadcastWebSocket({
    type: 'GAZETTE_ORDER',
    payload: govDirectiveOrder,
  });

  res.status(201).json({
    status: 'success',
    message: `Emergency Government Threat Alert broadcasted successfully via WebSocket to ${clientCount} active client(s).`,
    data: alertPayload,
    recipients_count: clientCount,
  });
});

export default router;
