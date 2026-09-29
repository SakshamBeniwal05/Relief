import express from 'express';
import { store } from '../data/store.js';

const router = express.Router();

/**
 * GET /api/reports/:id
 * Generates or retrieves full telemetry dossier for a given entity or incident.
 */
router.get('/reports/:id', (req, res) => {
  const entityId = req.params.id.toLowerCase();

  // 1. Direct match in dynamically generated AI reports
  if (store.incident_reports) {
    const directReport =
      store.incident_reports[entityId] ||
      Object.values(store.incident_reports).find(
        (r) =>
          r.report_id?.toLowerCase() === entityId ||
          r.order_code?.toLowerCase().includes(entityId) ||
          r.sector_name?.toLowerCase().includes(entityId)
      );
    if (directReport) {
      return res.json({
        status: 'success',
        data: directReport,
      });
    }
  }

  // Find matching location, incident, or zone
  const zone = store.hazard_zones.find(
    (z) => z.id.toLowerCase() === entityId || z.zone_code.toLowerCase().includes(entityId)
  );

  const telemetry = store.telemetry_logs.find(
    (t) => t.sensor_node_id.toLowerCase().includes(entityId) || (zone && t.location_id === zone.location_id)
  ) || store.telemetry_logs[0];

  const reportDossier = {
    report_id: `DOSSIER-${entityId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    generated_at_utc: new Date().toISOString(),
    classification: 'OFFICIAL USE ONLY • DISASTER MANAGEMENT ACT 2005',
    sector_name: zone ? zone.name : `${entityId.toUpperCase()} High Threat Sector`,
    zone_code: zone ? zone.zone_code : '#UK-2024-JOS-09',
    risk_level: zone ? zone.risk_level : 'CRITICAL',
    factor_of_safety: telemetry.factor_of_safety,
    active_directives: zone?.directives || 'Evacuate vulnerable structures immediately.',
    inclinometer_readings: [
      { depth_m: '0.0 - 1.0m', displacement_mm_24h: 3.2, status: 'Active creep' },
      { depth_m: '1.0 - 3.5m', displacement_mm_24h: 14.1, status: 'Primary shear plane' },
      { depth_m: '3.5 - 7.0m', displacement_mm_24h: 1.4, status: 'Colluvium bed' },
    ],
    hydrological_summary: {
      discharge_rate_m3s: 1024,
      spillway_threshold_m3s: 850,
      pore_pressure_kpa: telemetry.pore_pressure_kpa,
      rainfall_mmh: telemetry.rainfall_mmh,
      saturation_pct: telemetry.soil_saturation_pct,
    },
    evacuation_plan: {
      primary_route: 'Helang-Pipalkoti Bypass Corridor',
      staging_shelter: 'Gauchar Field Station Airstrip (58 beds available)',
      designated_helipad: 'Gauchar Sector 1 Helipad',
    },
    sign_off: {
      nodal_officer: 'Col. R. Sharma (Retd.), SDRF Commander',
      approval_stamp: 'DIGITAL_SEAL_UK_SDMA_SEC144',
    },
  };

  res.json({
    status: 'success',
    data: reportDossier,
  });
});

export default router;
