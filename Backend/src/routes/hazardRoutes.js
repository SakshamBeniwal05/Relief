import express from 'express';
import { store } from '../data/store.js';
import { evaluateSlopeStability } from '../ai/jevModel.js';
import { getDynamicRiskZoning } from '../services/riskZoningService.js';

const router = express.Router();

/**
 * GET /api/hazard-zones
 * Returns active dual-concentric hazard zones with core and buffer radiuses.
 */
router.get('/hazard-zones', (req, res) => {
  res.json({
    status: 'success',
    count: store.hazard_zones.length,
    data: store.hazard_zones,
  });
});

/**
 * GET /api/telemetry
 * Returns real-time sensor node telemetry readings.
 */
router.get('/telemetry', (req, res) => {
  res.json({
    status: 'success',
    count: store.telemetry_logs.length,
    data: store.telemetry_logs,
  });
});

/**
 * POST /api/telemetry/predict
 * Evaluates live environmental sensor payload with JEV Geotechnical Model.
 */
router.post('/telemetry/predict', (req, res) => {
  const { rainfall_mmh, pore_pressure_kpa, soil_saturation_pct, slope_tilt_deg } = req.body;

  const result = evaluateSlopeStability({
    rainfall_mmh: Number(rainfall_mmh || 10.0),
    pore_pressure_kpa: Number(pore_pressure_kpa || 150.0),
    soil_saturation_pct: Number(soil_saturation_pct || 50.0),
    slope_tilt_deg: Number(slope_tilt_deg || 30.0),
  });

  res.json({
    status: 'success',
    model: 'JEV_GEOTECHNICAL_V3',
    prediction: result,
  });
});

/**
 * GET /api/entities
 * Real-time dynamic calculation from store telemetry logs via the JEV AI Model.
 */
router.get('/entities', async (req, res) => {
  let riskData = null;
  try {
    riskData = await getDynamicRiskZoning();
  } catch (err) {
    console.warn('Risk zoning error in entities:', err);
  }

  const liveJos = riskData?.habitations?.find((h) => h.id === 'joshimath');
  const liveSunil = riskData?.habitations?.find((h) => h.id === 'sunil_ward');
  const livePipal = riskData?.habitations?.find((h) => h.id === 'pipalkoti');
  const liveCham = riskData?.habitations?.find((h) => h.id === 'chamoli_km214');
  const liveGauch = riskData?.habitations?.find((h) => h.id === 'gauchar_safe');

  // Fallback telemetry logs if needed
  const josTel = store.telemetry_logs.find((t) => t.location_id === 'LOC-JOS') || store.telemetry_logs[0];
  const josAi = evaluateSlopeStability(josTel);

  const entityMap = {
    joshimath: {
      id: '#UK-2024-JOS-09',
      category: `${liveJos?.zone || 'RED'} ZONE • ${liveJos?.riskLevel || 'HIGH RISK'} (${liveJos?.riskScore || 74.8}/100)`,
      badgeClass: liveJos?.badgeClass || 'bg-error text-white',
      title: 'Joshimath Ravigram Sector',
      meta: `Geotech Sensor Array #JOS-02 • Priority ${liveJos?.priorityRank || 1}`,
      desc: `Dynamic Risk Score: ${liveJos?.riskScore || 74.8}/100. Severe subsurface subsidence. Inclinometer indicates active displacement. ${liveJos?.actionProtocol || 'Prepare for Immediate Relocation.'}`,
      riskScore: liveJos?.riskScore ?? 74.8,
      zone: liveJos?.zone ?? 'RED',
      riskLevel: liveJos?.riskLevel ?? 'HIGH RISK',
      relocationPreparedness: liveJos?.relocationPreparedness ?? 'Prepare for Immediate Relocation',
      priorityRank: liveJos?.priorityRank ?? 1,
      actionProtocol: liveJos?.actionProtocol ?? 'Prepare for Immediate Relocation',
      telemetry: {
        fos: `${(liveJos?.liveTelemetry?.factorOfSafety ?? 0.41).toFixed(2)} Crit`,
        rain: `${Math.round(liveJos?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(liveJos?.liveTelemetry?.soilSatPct ?? 78)}% High`,
        pore: `${Math.round(liveJos?.liveTelemetry?.porePressureKpa ?? 184)} kPa`,
        tilt: '2.4° / 24h',
      },
      directives:
        liveJos?.actionProtocol ||
        'Section 144 enforced. Civilians must immediately evacuate red-flagged structures to Gauchar Staging Hub via designated bypass.',
      img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.556, lng: 79.563 },
    },
    alaknanda: {
      id: '#UK-2024-ALAK-14',
      category: `${livePipal?.zone || 'YELLOW'} ZONE • ${livePipal?.riskLevel || 'MODERATE RISK'} (${livePipal?.riskScore || 39.2}/100)`,
      badgeClass: livePipal?.badgeClass || 'bg-amber-500 text-white',
      title: 'Alaknanda Surge: Pipalkoti Hub',
      meta: `River Gauge Station #G-04 • Discharge: ${Math.round(livePipal?.liveTelemetry?.riverDischargeM3s || 98)} m³/s`,
      desc: `Dynamic Risk Score: ${livePipal?.riskScore || 39.2}/100. GloFAS Alaknanda discharge at ${Math.round(livePipal?.liveTelemetry?.riverDischargeM3s || 98)} m³/s. High-altitude glacial runoffs affecting low-lying riverbanks.`,
      riskScore: livePipal?.riskScore ?? 39.2,
      zone: livePipal?.zone ?? 'YELLOW',
      riskLevel: livePipal?.riskLevel ?? 'MODERATE RISK',
      relocationPreparedness: livePipal?.relocationPreparedness ?? 'Prepare & Monitor',
      priorityRank: livePipal?.priorityRank ?? 2,
      actionProtocol: livePipal?.actionProtocol,
      telemetry: {
        fos: `${(livePipal?.liveTelemetry?.factorOfSafety ?? 1.25).toFixed(2)} Mod`,
        rain: `${Math.round(livePipal?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(livePipal?.liveTelemetry?.soilSatPct ?? 52)}% Sat`,
        pore: `${Math.round(livePipal?.liveTelemetry?.porePressureKpa ?? 115)} kPa`,
        tilt: '0.8° / 24h',
      },
      directives:
        livePipal?.actionProtocol ||
        'Clear all riverbed and flood-plain settlements. Riverside pilgrimage camps barred until water recedes.',
      img1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.429, lng: 79.33 },
    },
    chamoli: {
      id: '#UK-2024-NH58-214',
      category: `${liveCham?.zone || 'RED'} ZONE • ${liveCham?.riskLevel || 'HIGH RISK'} (${liveCham?.riskScore || 74.8}/100)`,
      badgeClass: liveCham?.badgeClass || 'bg-error text-white',
      title: 'Chamoli NH-58 Blockade Slip',
      meta: `Highway Logistics KM Post 214 • Priority ${liveCham?.priorityRank || 1}`,
      desc: `Dynamic Risk Score: ${liveCham?.riskScore || 74.8}/100. Talus debris slide triggered by monsoonal runoff. FoS ${(liveCham?.liveTelemetry?.factorOfSafety ?? 0.31).toFixed(2)}. NH-58 closed to civilian traffic.`,
      riskScore: liveCham?.riskScore ?? 74.8,
      zone: liveCham?.zone ?? 'RED',
      riskLevel: liveCham?.riskLevel ?? 'HIGH RISK',
      relocationPreparedness: liveCham?.relocationPreparedness ?? 'Prepare for Immediate Relocation',
      priorityRank: liveCham?.priorityRank ?? 1,
      actionProtocol: liveCham?.actionProtocol,
      telemetry: {
        fos: `${(liveCham?.liveTelemetry?.factorOfSafety ?? 0.31).toFixed(2)} Block`,
        rain: `${Math.round(liveCham?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(liveCham?.liveTelemetry?.soilSatPct ?? 65)}% Mod`,
        pore: `${Math.round(liveCham?.liveTelemetry?.porePressureKpa ?? 132)} kPa`,
        tilt: '3.1° / 24h',
      },
      directives:
        liveCham?.actionProtocol ||
        'Reroute all civilian convoys through Helang bypass. Heavy commercial transport halted at Rudraprayag barrier.',
      img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.512, lng: 79.521 },
    },
    shelter_gauchar: {
      id: '#SHELTER-GAUCHAR-01',
      category: `${liveGauch?.zone || 'GREEN'} ZONE • ${liveGauch?.riskLevel || 'LOW RISK'} (${liveGauch?.riskScore || 18.0}/100)`,
      badgeClass: liveGauch?.badgeClass || 'bg-[#2e7d32] text-white',
      title: 'Gauchar Field Station Airstrip',
      meta: 'Designated Resettlement Hub 01 • Priority 3 (Safe Hub)',
      desc: `Dynamic Risk Score: ${liveGauch?.riskScore || 18.0}/100. Stable alluvial tableland (FoS ${(liveGauch?.liveTelemetry?.factorOfSafety ?? 10.15).toFixed(2)}). Primary safe transit shelter. Capacity 200 beds (58 beds available).`,
      riskScore: liveGauch?.riskScore ?? 18.0,
      zone: liveGauch?.zone ?? 'GREEN',
      riskLevel: liveGauch?.riskLevel ?? 'LOW RISK',
      relocationPreparedness: liveGauch?.relocationPreparedness ?? 'Normal Monitoring',
      priorityRank: liveGauch?.priorityRank ?? 3,
      actionProtocol: liveGauch?.actionProtocol,
      telemetry: {
        fos: `${(liveGauch?.liveTelemetry?.factorOfSafety ?? 10.15).toFixed(2)} Safe`,
        rain: `${Math.round(liveGauch?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(liveGauch?.liveTelemetry?.soilSatPct ?? 22)}% Safe`,
        pore: `${Math.round(liveGauch?.liveTelemetry?.porePressureKpa ?? 25)} kPa`,
        tilt: '0.0° Flat',
      },
      directives:
        liveGauch?.actionProtocol ||
        'Registration counters active 24/7. Immediate medical examination and dry ration kit issuance upon arrival.',
      img1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.291, lng: 79.155 },
    },
    gauchar_safe: {
      id: '#HAB-GAUCHAR-SAFE',
      category: `${liveGauch?.zone || 'GREEN'} ZONE • SAFE HABITATION (${liveGauch?.riskScore || 18.0}/100)`,
      badgeClass: liveGauch?.badgeClass || 'bg-[#2e7d32] text-white',
      title: 'Gauchar Alluvial Tableland',
      meta: 'Broad Flat River Terrace • Resettlement Study Area',
      desc: `Dynamic Risk Score: ${liveGauch?.riskScore || 18.0}/100. Stable fluvial terrace over Alaknanda bedrock with FoS ${(liveGauch?.liveTelemetry?.factorOfSafety ?? 10.15).toFixed(2)}. Zero active slope displacement or crack propagation. Designated low-risk geographic sector for civilian resettlement evaluation.`,
      riskScore: liveGauch?.riskScore ?? 18.0,
      zone: liveGauch?.zone ?? 'GREEN',
      riskLevel: liveGauch?.riskLevel ?? 'LOW RISK',
      relocationPreparedness: liveGauch?.relocationPreparedness ?? 'Normal Monitoring',
      priorityRank: liveGauch?.priorityRank ?? 3,
      actionProtocol:
        liveGauch?.actionProtocol ||
        'Normal civic and commercial monitoring. Geotechnical surveys indicate prime bedrock stability suitable for long-term municipal planning.',
      telemetry: {
        fos: `${(liveGauch?.liveTelemetry?.factorOfSafety ?? 10.15).toFixed(2)} Safe`,
        rain: `${Math.round(liveGauch?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(liveGauch?.liveTelemetry?.soilSatPct ?? 22)}% Safe`,
        pore: `${Math.round(liveGauch?.liveTelemetry?.porePressureKpa ?? 25)} kPa`,
        tilt: '0.0° Flat',
      },
      directives:
        'Maintain standard municipal vigilance. Continue automated inclinometer telemetry. Prime resettlement study sector.',
      img1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.291, lng: 79.155 },
    },
    camp_pipalkoti: {
      id: '#CAMP-SDRF-PIPAL-01',
      category: 'OPERATIONAL RELIEF CAMP • SDRF & NDRF',
      badgeClass: 'bg-emerald-700 text-white',
      title: 'SDRF & NDRF Unified Emergency Transit Camp',
      meta: 'Pipalkoti Inter-College Ground • Joint Emergency Command',
      desc: 'Frontline emergency evacuation & staging camp operated jointly by SDRF 3rd Bn, NDRF & Indian Red Cross. Provides immediate shelter pods, medical triage, hot meals, and child protection for evacuees arriving from Joshimath and Helang slips.',
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
      telemetry: {
        fos: '210/600 Free',
        rain: '18/40 Beds',
        sat: '16,000L Water',
        pore: '18d Food',
        tilt: 'SDRF Base',
      },
      directives:
        'Registration counters active 24/7. Immediate medical vitals check and family allotment token issued at Gate Counter 1. Emergency ambulance shuttle operational to Base Hospital.',
      img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.432, lng: 79.334 },
    },
    camp_chamoli: {
      id: '#CAMP-DDMA-CHAMOLI-02',
      category: 'OPERATIONAL RELIEF CAMP • DDMA & NGO',
      badgeClass: 'bg-emerald-700 text-white',
      title: 'Chamoli District & NGO Humanitarian Safe Haven',
      meta: 'District Sports Complex & Grounds • DDMA & SEWA Relief',
      desc: 'Central district-level humanitarian relief camp located at the Chamoli Sports Complex. Outfitted with family cubicles, pediatric wards, psycho-social trauma counseling, 24/7 community kitchens, and Aadhaar/DBT documentation verification desks.',
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
      telemetry: {
        fos: '340/850 Free',
        rain: '32/60 Beds',
        sat: '28,000L Water',
        pore: '25d Food',
        tilt: 'DDMA Base',
      },
      directives:
        'Central intake desk in main pavilion. Medical screening and special needs allocations at Gate 2. Hot community meal service operates continuously at Hall B.',
      img1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.402, lng: 79.324 },
    },
    sunil_ward: {
      id: '#HABITATION-SUNIL-02',
      category: `${liveSunil?.zone || 'RED'} ZONE • ${liveSunil?.riskLevel || 'HIGH RISK'} (${liveSunil?.riskScore || 69.7}/100)`,
      badgeClass: liveSunil?.badgeClass || 'bg-error text-white',
      title: 'Sunil Ward Upper Terrace',
      meta: `Sector B • 630 Families • Priority ${liveSunil?.priorityRank || 1}`,
      desc: `Dynamic Risk Score: ${liveSunil?.riskScore || 69.7}/100. Piezometer records heightened underground water pressure at 33.5° slope. FoS ${(liveSunil?.liveTelemetry?.factorOfSafety ?? 0.63).toFixed(2)}. ${liveSunil?.actionProtocol || 'Prepare for Immediate Relocation.'}`,
      riskScore: liveSunil?.riskScore ?? 69.7,
      zone: liveSunil?.zone ?? 'RED',
      riskLevel: liveSunil?.riskLevel ?? 'HIGH RISK',
      relocationPreparedness: liveSunil?.relocationPreparedness ?? 'Prepare for Immediate Relocation',
      priorityRank: liveSunil?.priorityRank ?? 1,
      actionProtocol: liveSunil?.actionProtocol,
      telemetry: {
        fos: `${(liveSunil?.liveTelemetry?.factorOfSafety ?? 0.63).toFixed(2)} Crit`,
        rain: `${Math.round(liveSunil?.liveTelemetry?.rainMmh ?? 0)} mm/h`,
        sat: `${Math.round(liveSunil?.liveTelemetry?.soilSatPct ?? 70)}% High`,
        pore: `${Math.round(liveSunil?.liveTelemetry?.porePressureKpa ?? 158)} kPa`,
        tilt: '1.9° / 24h',
      },
      directives:
        liveSunil?.actionProtocol ||
        'Phase 2 surveys underway. Residents requested to keep essential property records handy for SDM enumeration.',
      img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.56, lng: 79.57 },
    },
    gazette: {
      id: '#UK-GOV-2024-88',
      category: 'GAZETTE NOTIFICATION',
      badgeClass: 'bg-primary-fixed text-on-primary-fixed',
      title: 'Phase 1 DBT Ex-gratia Disbursement',
      meta: 'Uttarakhand SDMA Executive Order',
      desc: '₹1.5 Lakh/family direct ex-gratia compensation released for 412 immediately displaced families of Joshimath Red Zone.',
      riskScore: 85.0,
      zone: 'RED',
      riskLevel: 'HIGH RISK (RELOCATION ORDER)',
      relocationPreparedness: 'Prepare for Immediate Relocation',
      priorityRank: 1,
      actionProtocol: 'Immediate DBT clearance and provisional patta allocation in Gauchar/Pipalkoti safe zones.',
      telemetry: {
        fos: 'N/A Gov',
        rain: 'N/A',
        sat: '412 Benef.',
        pore: '₹6.18 Cr',
        tilt: 'Oct 12 Due',
      },
      directives:
        'Ensure Aadhaar seed in bank accounts. Grievances may be filed at Chamoli SDM Camp Office or SEOC helpline 1070.',
      img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      coordinates: { lat: 30.556, lng: 79.563 },
    },
  };

  res.json({
    status: 'success',
    data: entityMap,
  });
});

export default router;
