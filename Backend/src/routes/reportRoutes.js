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

  // 1b. Dedicated Relief Camp Dossiers
  if (entityId === 'camp_pipalkoti' || entityId === '#camp-sdrf-pipal-01') {
    return res.json({
      status: 'success',
      data: {
        report_id: 'DOSSIER-CAMP-PIPALKOTI-01',
        generated_at_utc: new Date().toISOString(),
        classification: 'OFFICIAL USE ONLY • DISASTER MANAGEMENT ACT 2005 • RELIEF CAMP AUDIT',
        sector_name: 'SDRF & NDRF Unified Emergency Transit Camp',
        zone_code: '#CAMP-SDRF-PIPAL-01',
        risk_level: 'OPERATIONAL RELIEF CAMP',
        isReliefCamp: true,
        campData: {
          totalCapacity: 600,
          availableCapacity: 210,
          occupiedCapacity: 390,
          totalMedicalBeds: 40,
          availableMedicalBeds: 18,
          icuTriageBeds: 6,
          operatingAgencies: 'Uttarakhand SDRF 3rd Bn, NDRF 8th Bn & Indian Red Cross Society',
          waterReserveLiters: 16000,
          dailyWaterSupplyLiters: 5000,
          dryRationsDays: 18,
          bioToiletsCount: 24,
          powerAndComms: '15 kVA Diesel Generator + BSNL Satellite Terminal + SDRF VHF Command Link',
          ambulanceCount: 4,
          helipadDistance: '400m Drop-Zone',
          admissionProtocol: 'Immediate token registration at Gate Counter 1. Vitals screening at Red Cross medical tent. Emergency transition kits issued upon family verification.',
        },
        active_directives: 'Registration counters active 24/7. Immediate medical vitals check and family allotment token issued at Gate Counter 1. Emergency ambulance shuttle operational to Base Hospital.',
        evacuation_plan: {
          primary_route: 'NH-58 Pipalkoti Transit Route',
          staging_shelter: 'Pipalkoti Inter-College Ground Hub',
          designated_helipad: 'Pipalkoti Emergency Helipad (400m)',
        },
        sign_off: {
          nodal_officer: 'Maj. S. Negi, Camp Commandant (SDRF 3rd Bn)',
          approval_stamp: 'DIGITAL_SEAL_UK_SDMA_RELIEF_CAMP',
        },
      },
    });
  }

  if (entityId === 'camp_chamoli' || entityId === '#camp-ddma-chamoli-02') {
    return res.json({
      status: 'success',
      data: {
        report_id: 'DOSSIER-CAMP-CHAMOLI-02',
        generated_at_utc: new Date().toISOString(),
        classification: 'OFFICIAL USE ONLY • DISASTER MANAGEMENT ACT 2005 • RELIEF CAMP AUDIT',
        sector_name: 'Chamoli District & NGO Humanitarian Safe Haven',
        zone_code: '#CAMP-DDMA-CHAMOLI-02',
        risk_level: 'OPERATIONAL RELIEF CAMP',
        isReliefCamp: true,
        campData: {
          totalCapacity: 850,
          availableCapacity: 340,
          occupiedCapacity: 510,
          totalMedicalBeds: 60,
          availableMedicalBeds: 32,
          icuTriageBeds: 10,
          operatingAgencies: 'District Disaster Management Authority (DDMA), NDRF Logistics & SEWA International NGO',
          waterReserveLiters: 28000,
          dailyWaterSupplyLiters: 8000,
          dryRationsDays: 25,
          bioToiletsCount: 36,
          powerAndComms: '25 kW Solar Microgrid + High-Speed Emergency Wi-Fi Hub + Starlink Backup',
          ambulanceCount: 6,
          helipadDistance: 'Onsite Air Corridor',
          admissionProtocol: 'Central intake desk in main stadium pavilion. Aadhaar verification & DBT enumeration desk #4 open 08:00 - 20:00.',
        },
        active_directives: 'Central intake desk in main pavilion. Medical screening and special needs allocations at Gate 2. Hot community meal service operates continuously at Hall B.',
        evacuation_plan: {
          primary_route: 'Chamoli Bypass Expressway Corridor',
          staging_shelter: 'Chamoli District Sports Complex & Grounds',
          designated_helipad: 'Chamoli Sports Ground Onsite Helipad',
        },
        sign_off: {
          nodal_officer: 'Dr. V. K. Rawat, Chief Medical Relief Officer (DDMA)',
          approval_stamp: 'DIGITAL_SEAL_UK_DDMA_CAMP_AUTH',
        },
      },
    });
  }

  if (entityId === 'gauchar_safe' || entityId === '#hab-gauchar-safe') {
    return res.json({
      status: 'success',
      data: {
        report_id: 'DOSSIER-HAB-GAUCHAR-SAFE',
        generated_at_utc: new Date().toISOString(),
        classification: 'OFFICIAL USE ONLY • GEOLOGICAL SURVEY OF INDIA & UK-SDMA',
        sector_name: 'Gauchar Alluvial Tableland',
        zone_code: '#HAB-GAUCHAR-SAFE',
        risk_level: 'LOW RISK (GREEN ZONE)',
        factor_of_safety: 10.15,
        active_directives: 'Normal civic and commercial monitoring. Geotechnical surveys indicate prime bedrock stability suitable for long-term municipal planning.',
        hydrological_summary: {
          discharge_rate_m3s: 240,
          spillway_threshold_m3s: 850,
          pore_pressure_kpa: 25,
          rainfall_mmh: 0,
          saturation_pct: 22,
        },
        evacuation_plan: {
          primary_route: 'Rudraprayag-Gauchar All-Weather Corridor',
          staging_shelter: 'Gauchar Tableland Municipal Township Site',
          designated_helipad: 'Gauchar Airstrip & Helipad Complex',
        },
        sign_off: {
          nodal_officer: 'Dr. H. Pant, Chief Geologist (GSI)',
          approval_stamp: 'DIGITAL_SEAL_GSI_GREEN_ZONE_CLEARED',
        },
      },
    });
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
