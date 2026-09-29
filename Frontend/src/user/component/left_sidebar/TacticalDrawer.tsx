import React, { useState, useEffect } from 'react';
import type {
  ModeType,
  Mode1Filter,
  Mode2SubTab,
  LiveDisasterEvent,
  DynamicRiskZoningData,
  HabitationRiskProfile,
} from '../../types';
import { checkLocationHasActiveGovOrder, getActiveGovernmentDirectives } from '../../../services/api';

interface TacticalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ModeType;
  onSelectEntity: (key: string) => void;
  onOpenVolunteerModal: () => void;
  onOpenMapSettings?: () => void;
  onOpenRehabilitationModal?: () => void;
  liveDisasters?: LiveDisasterEvent[];
  dynamicRiskData?: DynamicRiskZoningData | null;
  userGpsCoords?: { lat: number; lng: number } | null;
  gpsAccuracy?: number | null;
}

const DEFAULT_HABITATIONS: HabitationRiskProfile[] = [
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
    riskScore: 74.8,
    zone: 'RED',
    riskLevel: 'HIGH RISK',
    relocationPreparedness: 'Prepare for Immediate Relocation',
    priorityRank: 1,
    actionProtocol:
      'Immediate Section 144 Enforced. Rapid relocation queue #1 active (0-3 Months). Issue priority replacement land plot token and execute immediate ₹1.5L ex-gratia DBT transfer.',
    color: '#D32F2F',
    badgeClass: 'bg-error text-white',
    liveTelemetry: {
      tempC: 18.2,
      rainMmh: 0,
      humidity: 62,
      soilMoistureVol: 0.38,
      soilSatPct: 78,
      porePressureKpa: 184,
      factorOfSafety: 0.41,
      riverDischargeM3s: 98,
      nearestQuake: { magnitude: 4.1, distanceKm: 180 },
    },
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
    riskScore: 74.8,
    zone: 'RED',
    riskLevel: 'HIGH RISK',
    relocationPreparedness: 'Prepare for Immediate Relocation',
    priorityRank: 1,
    actionProtocol:
      'Reroute civilian convoys through Helang bypass. Heavy commercial transport halted at Rudraprayag barrier.',
    color: '#D32F2F',
    badgeClass: 'bg-error text-white',
    liveTelemetry: {
      tempC: 20.1,
      rainMmh: 0,
      humidity: 60,
      soilMoistureVol: 0.34,
      soilSatPct: 65,
      porePressureKpa: 132,
      factorOfSafety: 0.31,
      riverDischargeM3s: 98,
      nearestQuake: { magnitude: 4.1, distanceKm: 185 },
    },
  },
  {
    id: 'sunil_ward',
    name: 'Sunil Ward Upper Terrace',
    district: 'Chamoli',
    coordinates: { lat: 30.56, lng: 79.57 },
    slopeAngleDeg: 33.5,
    soilCohesionKpa: 17.5,
    failureDepthM: 3.2,
    affectedFamilies: 630,
    structuresRedFlagged: 34,
    isRiverToeSector: false,
    baseGeology: 'Glacial Till & Unconsolidated Talus',
    riskScore: 69.7,
    zone: 'RED',
    riskLevel: 'HIGH RISK',
    relocationPreparedness: 'Prepare for Immediate Relocation',
    priorityRank: 1,
    actionProtocol:
      'Phase 2 surveys underway. Residents requested to keep essential property records handy for SDM enumeration.',
    color: '#D32F2F',
    badgeClass: 'bg-error text-white',
    liveTelemetry: {
      tempC: 17.9,
      rainMmh: 0,
      humidity: 64,
      soilMoistureVol: 0.36,
      soilSatPct: 70,
      porePressureKpa: 158,
      factorOfSafety: 0.63,
      riverDischargeM3s: 98,
      nearestQuake: { magnitude: 4.1, distanceKm: 181 },
    },
  },
  {
    id: 'pipalkoti',
    name: 'Pipalkoti North Corridor',
    district: 'Chamoli',
    coordinates: { lat: 30.429, lng: 79.33 },
    slopeAngleDeg: 24.0,
    soilCohesionKpa: 22.0,
    failureDepthM: 2.5,
    affectedFamilies: 180,
    structuresRedFlagged: 12,
    isRiverToeSector: true,
    baseGeology: 'Dolomite & Quartzite Fluvial Terrace',
    riskScore: 39.2,
    zone: 'YELLOW',
    riskLevel: 'MODERATE RISK',
    relocationPreparedness: 'Prepare & Monitor',
    priorityRank: 2,
    actionProtocol:
      'Continuous sensor telemetry monitoring & acoustic crack logging. Phased relocation preparedness (3-12 Months). Enforce physical document submission at Tehsil Desk #3.',
    color: '#ED6C02',
    badgeClass: 'bg-amber-500 text-white',
    liveTelemetry: {
      tempC: 22.4,
      rainMmh: 0,
      humidity: 55,
      soilMoistureVol: 0.28,
      soilSatPct: 52,
      porePressureKpa: 115,
      factorOfSafety: 1.25,
      riverDischargeM3s: 98,
      nearestQuake: { magnitude: 4.1, distanceKm: 202 },
    },
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
    riskScore: 18.0,
    zone: 'GREEN',
    riskLevel: 'LOW RISK',
    relocationPreparedness: 'Normal Monitoring',
    priorityRank: 3,
    actionProtocol:
      'Normal civic and commercial monitoring. Designated safe transit shelters and reception staging areas for evacuees.',
    color: '#2E7D32',
    badgeClass: 'bg-[#2e7d32] text-white',
    liveTelemetry: {
      tempC: 24.8,
      rainMmh: 0,
      humidity: 48,
      soilMoistureVol: 0.14,
      soilSatPct: 22,
      porePressureKpa: 25,
      factorOfSafety: 10.15,
      riverDischargeM3s: 98,
      nearestQuake: { magnitude: 4.1, distanceKm: 225 },
    },
  },
];

// Helper: Haversine distance formula in Kilometers
function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
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

// AI Geotechnical & Hydrological Forecasting Models
interface AiPredictionItem {
  id: string;
  entityKey: string;
  name: string;
  sector: string;
  coordinates: { lat: number; lng: number };
  modelName: string;
  riskScore: number; // 0-100
  timeHorizon: string;
  impactRadiusKm: number; // AI predicted (purple / blue / light-blue)
  realImpactRadiusKm: number; // Real ground observed (red / yellow / green)
  realZoneLabel: string;
  realColorHex: string;
  predictionSummary: string;
  telemetryNote: string;
  confidencePct: number;
  icon: string;
}

const AI_PREDICTIONS: AiPredictionItem[] = [
  {
    id: 'ai-jos-01',
    entityKey: 'joshimath',
    name: 'Joshimath Ravigram Sector AI Subsidence Model',
    sector: 'Ravigram Sector, Chamoli',
    coordinates: { lat: 30.556, lng: 79.563 },
    modelName: 'JEV Geotechnical Deep Slope Displacement Model',
    riskScore: 82.4, // 70-100 -> Purple
    timeHorizon: 'Next 24-48 Hours',
    impactRadiusKm: 5.2, // AI Predicted Radius
    realImpactRadiusKm: 3.2, // Real Ground Failure Radius (Red)
    realZoneLabel: 'RED ZONE (High Risk)',
    realColorHex: '#dc2626',
    predictionSummary:
      'Pore-pressure spike of 412 kPa projected to accelerate slope creep past 18 mm/day. High probability of progressive shear failure along Ravigram detachment surface.',
    telemetryNote: 'FoS Proj: 0.41 | Pore-Pressure: 412 kPa | Rain: 84mm/h',
    confidencePct: 94.6,
    icon: 'landslide',
  },
  {
    id: 'ai-cham-02',
    entityKey: 'chamoli',
    name: 'Chamoli NH-58 KM 214 Kinematic Slip Model',
    sector: 'NH-58 Corridor, Chamoli',
    coordinates: { lat: 30.512, lng: 79.521 },
    modelName: 'Kinematic Talus & Rockfall Trajectory Predictor',
    riskScore: 76.5, // 70-100 -> Purple
    timeHorizon: 'Next 12 Hours',
    impactRadiusKm: 4.0, // AI Predicted Radius
    realImpactRadiusKm: 2.4, // Real Ground Blockade Radius (Red)
    realZoneLabel: 'RED ZONE (High Risk)',
    realColorHex: '#dc2626',
    predictionSummary:
      'Upper talus wedge detachment predicted to overwhelm concrete rockfall catchers at KM post 214. Secondary slip vector intercepts NH-58 culvert 14.',
    telemetryNote: 'FoS Proj: 0.38 | Debris Volume: 14,000 m³ | Rain: 68mm/h',
    confidencePct: 91.8,
    icon: 'minor_crash',
  },
  {
    id: 'ai-sunil-03',
    entityKey: 'sunil_ward',
    name: 'Sunil Ward Upper Terrace Creep Prediction',
    sector: 'Sunil Ward, Chamoli',
    coordinates: { lat: 30.56, lng: 79.57 },
    modelName: 'GSI ResNet Borehole Acoustic Emission Predictor',
    riskScore: 58.6, // 40-69.9 -> Blue
    timeHorizon: 'Next 72 Hours',
    impactRadiusKm: 3.8, // AI Predicted Radius
    realImpactRadiusKm: 2.1, // Real Ground Slip Radius (Yellow)
    realZoneLabel: 'YELLOW ZONE (Moderate)',
    realColorHex: '#d97706',
    predictionSummary:
      'Moderate progressive creep along glacial till interface. Structure stress redistribution underway; structural cracks expected to widen by 3.2 mm.',
    telemetryNote: 'FoS Proj: 1.05 | Displacement: +3.2mm/24h | Tilt: 1.4°',
    confidencePct: 88.7,
    icon: 'warning',
  },
  {
    id: 'ai-alak-04',
    entityKey: 'alaknanda',
    name: 'Alaknanda Hydraulic Backwater AI Surge Forecast',
    sector: 'Pipalkoti Fluvial Corridor',
    coordinates: { lat: 30.429, lng: 79.33 },
    modelName: 'Hydro-Ensemble Inflow Inversion Model',
    riskScore: 46.8, // 40-69.9 -> Blue
    timeHorizon: 'Next 18 Hours',
    impactRadiusKm: 8.5, // AI Predicted Radius
    realImpactRadiusKm: 4.8, // Real Spillway Floodplain Radius (Yellow)
    realZoneLabel: 'YELLOW ZONE (Moderate)',
    realColorHex: '#d97706',
    predictionSummary:
      'Discharge peaking around 1,024 m³/s. River toe hydraulic scour predicted against embankment retaining walls with moderate overbank inundation.',
    telemetryNote: 'FoS Proj: 1.12 | Peak Surge: 1,024 m³/s | Spillway: 98%',
    confidencePct: 86.4,
    icon: 'flood',
  },
  {
    id: 'ai-gauch-05',
    entityKey: 'shelter_gauchar',
    name: 'Gauchar Alluvial Tableland Stability AI Forecast',
    sector: 'Gauchar Resettlement Zone',
    coordinates: { lat: 30.291, lng: 79.155 },
    modelName: 'SAR InSAR Stability & Micro-Seismic Classifier',
    riskScore: 16.5, // 0-39.9 -> Light-Blue
    timeHorizon: 'Next 7 Days',
    impactRadiusKm: 12.0, // AI Predicted Radius
    realImpactRadiusKm: 5.0, // Real Safe Hub Perimeter (Green)
    realZoneLabel: 'GREEN ZONE (Safe Hub)',
    realColorHex: '#16a34a',
    predictionSummary:
      'Zero active ground displacement observed. Bedrock stability verified with Factor of Safety > 2.40. Optimal geomechanical stability verified for long-term civilian relocation shelters.',
    telemetryNote: 'FoS Proj: > 2.40 | Sat: 22% Safe | Quiescent',
    confidencePct: 98.6,
    icon: 'night_shelter',
  },
];

// Color Theme Helper for AI Predictions:
// 70 - 100: Purple
// 40 - 69.9: Blue
// 0 - 39.9: Light-Blue
function getAiTheme(score: number) {
  if (score >= 70) {
    return {
      bandLabel: 'CRITICAL (70-100)',
      borderClass: 'border-purple-600',
      badgeClass: 'bg-purple-600 text-white',
      accentColor: 'text-purple-600 dark:text-purple-400',
      lightBg: 'bg-purple-50/70 dark:bg-purple-950/20',
      pingColor: 'bg-purple-600',
      strokeHex: '#9333ea',
    };
  } else if (score >= 40) {
    return {
      bandLabel: 'MODERATE (40-69.9)',
      borderClass: 'border-blue-600',
      badgeClass: 'bg-blue-600 text-white',
      accentColor: 'text-blue-600 dark:text-blue-400',
      lightBg: 'bg-blue-50/70 dark:bg-blue-950/20',
      pingColor: 'bg-blue-600',
      strokeHex: '#2563eb',
    };
  } else {
    return {
      bandLabel: 'LOW (0-39.9)',
      borderClass: 'border-sky-400',
      badgeClass: 'bg-sky-500 text-white',
      accentColor: 'text-sky-600 dark:text-sky-400',
      lightBg: 'bg-sky-50/70 dark:bg-sky-950/20',
      pingColor: 'bg-sky-400',
      strokeHex: '#38bdf8',
    };
  }
}

// Color Theme & Emblem Helper for Official Government Directives:
function getGovDirectiveTheme(severity: string = '', orderType: string = '') {
  const s = (severity || '').toUpperCase();
  const t = (orderType || '').toUpperCase();

  if (s.includes('CRITICAL') || t.includes('144') || t.includes('EVACUATION')) {
    return {
      bandLabel: 'CRITICAL MANDATE',
      borderClass: 'border-red-600',
      badgeClass: 'bg-red-600 text-white',
      accentColor: 'text-red-600 dark:text-red-400',
      pingColor: 'bg-red-600',
      icon: 'crisis_alert',
    };
  } else if (s.includes('SEVERE') || t.includes('BLOCKADE') || t.includes('ROAD') || t.includes('CUT') || t.includes('LOCKDOWN')) {
    return {
      bandLabel: 'HIGH SEVERITY',
      borderClass: 'border-amber-600',
      badgeClass: 'bg-amber-600 text-white',
      accentColor: 'text-amber-600 dark:text-amber-400',
      pingColor: 'bg-amber-600',
      icon: 'minor_crash',
    };
  } else if (t.includes('GAZETTE') || t.includes('DBT') || t.includes('REHABILITATION') || t.includes('EX-GRATIA')) {
    return {
      bandLabel: 'GAZETTE DIRECTIVE',
      borderClass: 'border-primary',
      badgeClass: 'bg-primary text-on-primary',
      accentColor: 'text-primary',
      pingColor: 'bg-primary',
      icon: 'policy',
    };
  } else {
    return {
      bandLabel: 'TACTICAL ADVISORY',
      borderClass: 'border-blue-600',
      badgeClass: 'bg-blue-600 text-white',
      accentColor: 'text-blue-600 dark:text-blue-400',
      pingColor: 'bg-blue-600',
      icon: 'campaign',
    };
  }
}

export const TacticalDrawer: React.FC<TacticalDrawerProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectEntity,
  onOpenVolunteerModal,
  onOpenMapSettings,
  onOpenRehabilitationModal,
  liveDisasters = [],
  dynamicRiskData,
  userGpsCoords,
  gpsAccuracy,
}) => {
  const [mode1Filter, setMode1Filter] = useState<Mode1Filter>('official');
  const [mode2SubTab, setMode2SubTab] = useState<Mode2SubTab>('queues');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [activeDirectives, setActiveDirectives] = useState<any[]>(() => getActiveGovernmentDirectives());

  useEffect(() => {
    const handleUpdate = () => {
      setActiveDirectives(getActiveGovernmentDirectives());
    };
    window.addEventListener('sih-active-directives-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sih-active-directives-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const allHabitations = dynamicRiskData?.habitations?.length
    ? dynamicRiskData.habitations
    : DEFAULT_HABITATIONS;

  const filteredHabitations =
    zoneFilter === 'ALL'
      ? allHabitations
      : allHabitations.filter((h) => h.zone === zoneFilter);

  const totalFamilies = allHabitations.reduce((acc, h) => acc + (h.affectedFamilies || 0), 0);
  const redCount = allHabitations.filter((h) => h.zone === 'RED').length;
  const yellowCount = allHabitations.filter((h) => h.zone === 'YELLOW').length;
  const greenCount = allHabitations.filter((h) => h.zone === 'GREEN').length;

  // Real-Time User GPS Reference (Defaults to Kedarnath Basin command center if GPS is initializing)
  const effectiveGps = userGpsCoords || { lat: 30.556, lng: 79.563 };

  // Dynamically broadcasted official government alerts & directives from Admin
  const dynamicGovAlertCandidates = activeDirectives
    .filter((d: any) => d.id !== 'UK-GOV-2024-88')
    .map((d: any) => {
      const radiusKm = d.threatRadiusMeters ? d.threatRadiusMeters / 1000 : 3.2;
      const coords = d.coordinates || { lat: 30.556, lng: 79.563 };
      return {
        id: `gov-broadcast-${d.id || d.order_code}`,
        title: d.sector || d.targetSector || 'Official Sector Enactment',
        category: `OFFICIAL GOV ALERT • ${d.threat_severity || 'CRITICAL'}`,
        badgeClass:
          d.threat_severity === 'CRITICAL'
            ? 'bg-error text-white'
            : d.threat_severity === 'SEVERE'
            ? 'bg-amber-600 text-white'
            : 'bg-blue-600 text-white',
        borderClass:
          d.threat_severity === 'CRITICAL'
            ? 'border-error'
            : d.threat_severity === 'SEVERE'
            ? 'border-amber-600'
            : 'border-blue-600',
        coordinates: coords,
        impactRadiusKm: radiusKm,
        desc: d.directiveText || d.description || 'Mandatory Government Threat Directive Enforced.',
        telemetry: `Gov Order: ${d.order_code || d.id} • Core: ${radiusKm.toFixed(1)}km (+20km buffer)`,
        timeAgo: d.timestamp || 'Active',
        isOfficialGovAlert: true,
      };
    });

  // Candidate Alerts for Local Updates Evaluation (d <= impactRadiusKm + 20 km)
  const localAlertCandidates = [
    ...dynamicGovAlertCandidates,
    {
      id: 'joshimath',
      title: 'Joshimath Ravigram Sector',
      category: 'CRITICAL • SECTION 144',
      badgeClass: 'bg-error text-white',
      borderClass: 'border-error',
      coordinates: { lat: 30.556, lng: 79.563 },
      impactRadiusKm: 5.0,
      desc: 'Slope subsidence acceleration detected. Factor of Safety degraded to 0.84. 14 units flagged for emergency relocation.',
      telemetry: 'FoS: 0.84 | Rain: 84mm/h | Inclinometer: +14mm',
      timeAgo: '04m ago',
    },
    {
      id: 'chamoli',
      title: 'Chamoli NH-58 Blockade Slip',
      category: 'HIGH SLIP RISK • ROAD CUT',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-600',
      coordinates: { lat: 30.512, lng: 79.521 },
      impactRadiusKm: 4.0,
      desc: 'Talus debris rockfall at KM post 214. Highway completely severed. Reroute via Helang bypass.',
      telemetry: 'NH-58 Blocked | Rain: 68mm/h | Sat: 88%',
      timeAgo: '28m ago',
    },
    {
      id: 'alaknanda',
      title: 'Alaknanda Surge: Pipalkoti Hub',
      category: 'FLASH FLOOD VECTOR',
      badgeClass: 'bg-blue-600 text-white',
      borderClass: 'border-blue-600',
      coordinates: { lat: 30.429, lng: 79.33 },
      impactRadiusKm: 8.0,
      desc: 'Gauge station G-4 discharge crossed safe spillway capacity at 1,024 m³/s. Riverfront buffer cleared.',
      telemetry: 'Discharge: 1,024 m³/s | Rain: 112mm/h',
      timeAgo: '12m ago',
    },
    {
      id: 'sunil_ward',
      title: 'Sunil Ward Upper Terrace',
      category: 'RELOCATION • SHORT-TERM',
      badgeClass: 'bg-amber-600 text-white',
      borderClass: 'border-amber-600',
      coordinates: { lat: 30.56, lng: 79.57 },
      impactRadiusKm: 3.5,
      desc: 'Piezometer records heightened underground water pressure at 34° slope angle. Scheduled for second-phase resettlement.',
      telemetry: 'FoS: 1.08 | Rain: 72mm/h | Pore: 280kPa',
      timeAgo: '45m ago',
    },
    ...liveDisasters.map((d) => ({
      id: d.id,
      title: d.title,
      category: `${d.category} • ${d.severity}`,
      badgeClass: d.badgeClass || 'bg-error text-white',
      borderClass: 'border-error',
      coordinates: d.coordinates,
      impactRadiusKm: d.impactRadiusMeters ? d.impactRadiusMeters / 1000 : 15.0,
      desc: d.desc,
      telemetry:
        typeof d.telemetry?.fos === 'number'
          ? `FoS: ${d.telemetry.fos.toFixed(2)}`
          : d.telemetry?.liveParam || d.source,
      timeAgo: d.timestamp,
    })),
  ];

  // STEP 2: WITHIN 20KM RANGE AFTER IMPACT RADIUS FILTER
  // Show alert IF AND ONLY IF distance <= (impactRadiusKm + 20 km)
  const localUpdatesWithinRange = localAlertCandidates
    .map((item) => {
      const dist = calculateHaversineDistanceKm(
        effectiveGps.lat,
        effectiveGps.lng,
        item.coordinates.lat,
        item.coordinates.lng
      );
      const isInsideImpactRadius = dist <= item.impactRadiusKm;
      const bufferThresholdKm = item.impactRadiusKm + 20.0;
      const isWithinBufferRange = dist <= bufferThresholdKm;
      const bufferDeltaKm = Math.max(0, dist - item.impactRadiusKm);

      return {
        ...item,
        distanceKm: dist,
        isInsideImpactRadius,
        isWithinBufferRange,
        bufferDeltaKm,
      };
    })
    .filter((item) => item.isWithinBufferRange)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <aside
      className={`fixed left-4 top-20 bottom-4 z-30 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-[115%]'
      }`}
      id="tactical-drawer"
    >
      {/* Drawer Header (Level 1 Heading & Level 2 Sub-heading) */}
      <div className="p-3.5 border-b border-outline-variant/80 flex items-center justify-between bg-surface-container/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-sm">
              {currentMode === 1 ? 'policy' : 'alt_route'}
            </span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-base md:text-lg text-on-surface tracking-tight">
              {currentMode === 1 ? 'Threat Radar & Alerts' : 'Relocation & Lifelines'}
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">
              {currentMode === 1
                ? 'Government Directives & AI Forewarning'
                : 'Habitations, Shelters & Gazette Timelines'}
            </p>
          </div>
        </div>
        <button
          className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 text-on-surface-variant"
          onClick={onClose}
          type="button"
          title="Close drawer"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      </div>

      {/* MODE 1: THREAT RADAR, AI PREDICTIONS & LOCAL UPDATES */}
      {currentMode === 1 && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 tactical-scroll">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full text-xs font-bold sticky top-0 z-10 backdrop-blur-md">
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'official'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('official')}
              type="button"
            >
              Gov Directives
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'ai'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('ai')}
              type="button"
            >
              AI Predictions
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'updates'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('updates')}
              type="button"
            >
              Local Updates
            </button>
          </div>

          {/* TAB 1: OFFICIAL GOVERNMENT DIRECTIVES */}
          {mode1Filter === 'official' && (() => {
            const govDirectiveItems = [
              // 1. Dynamically Published Directives from Admin Dashboard
              ...activeDirectives
                .filter((d: any) => d.id !== 'UK-GOV-2024-88' && d.id !== 'UK-GOV-2024-89')
                .map((d: any) => {
                  const radiusKm = d.threatRadiusMeters ? d.threatRadiusMeters / 1000 : 3.2;
                  const coords = d.coordinates || { lat: 30.556, lng: 79.563 };
                  return {
                    id: d.id || d.order_code,
                    orderCode: d.order_code || d.id || '#UK-GOV-LIVE',
                    title: d.sector || d.targetSector || 'Official Sector Enactment',
                    authority: d.authority || 'District Magistrate & SDRF Unified Command',
                    orderType: d.orderType || 'Official Emergency Government Directive',
                    severity: d.threat_severity || 'CRITICAL',
                    description: d.directiveText || d.description || 'Mandatory Government Threat Directive Enforced.',
                    coordinates: coords,
                    radiusKm,
                    telemetry: d.liveWeather ? `Temp: ${d.liveWeather.tempC}°C | Rain: ${d.liveWeather.rainMmh}mm/h` : `Core: ${radiusKm.toFixed(1)}km | Buffer: ${(radiusKm + 20).toFixed(1)}km`,
                    timeAgo: d.timestamp || 'Live Active',
                    entityKey: d.sectorKey || 'joshimath',
                    isGazetteModal: false,
                  };
                }),

              // 2. Joshimath Ravigram Sector
              {
                id: 'UK-GOV-2024-88',
                orderCode: '#UK-GOV-2024-88',
                title: 'Joshimath Ravigram Sector',
                authority: 'District Magistrate & SDRF Unified Command',
                orderType: 'Section 144 Emergency Evacuation',
                severity: 'CRITICAL',
                description:
                  'Section 144 enforced. Civilians must immediately evacuate red-flagged structures to Gauchar Staging Hub via designated bypass.',
                coordinates: { lat: 30.556, lng: 79.563 },
                radiusKm: 3.2,
                telemetry: 'FoS: 0.84 Crit | Rain: 84mm/h',
                timeAgo: '04m ago',
                entityKey: 'joshimath',
                isGazetteModal: false,
              },

              // 3. Chamoli NH-58 Road Slip
              {
                id: 'UK-GOV-2024-89',
                orderCode: '#UK-GOV-2024-89',
                title: 'Chamoli NH-58 Blockade Slip',
                authority: 'Chamoli District Police & PWD Highway Wing',
                orderType: 'Highway Lockdown & Debris Diversion',
                severity: 'SEVERE',
                description:
                  'Talus debris rockfall at KM post 214. Highway completely severed. Heavy vehicles diverted via Pipalkoti-Helang bypass.',
                coordinates: { lat: 30.512, lng: 79.521 },
                radiusKm: 2.4,
                telemetry: 'NH-58 Blocked • PWD Onsite | Rain: 68mm/h',
                timeAgo: '28m ago',
                entityKey: 'chamoli',
                isGazetteModal: false,
              },

              // 4. Alaknanda Surge: Pipalkoti Hub
              {
                id: 'UK-GOV-2024-90',
                orderCode: '#UK-GOV-2024-90',
                title: 'Alaknanda Surge: Pipalkoti Hub',
                authority: 'Central Water Commission & SDRF Flood Unit',
                orderType: 'Riverbed Cordon & Flood Evacuation',
                severity: 'ADVISORY',
                description:
                  'Discharge has surged to 1,024 m³/s past safe spillway limit. High-altitude glacial lake runoffs affecting low-lying riverbanks.',
                coordinates: { lat: 30.429, lng: 79.33 },
                radiusKm: 4.8,
                telemetry: 'Discharge: 1,024 m³/s | Rain: 112mm/h',
                timeAgo: '12m ago',
                entityKey: 'alaknanda',
                isGazetteModal: false,
              },

              // 5. Phase 1 DBT Ex-gratia Disbursement (Gazette Notification)
              {
                id: 'UK-GOV-2024-GAZ-412',
                orderCode: '#UK-GOV-2024-GAZ-412',
                title: 'Phase 1 DBT Ex-gratia Disbursement',
                authority: 'Uttarakhand SDMA & Revenue Department',
                orderType: 'Statutory Gazette Relocation Order',
                severity: 'GAZETTE',
                description:
                  '₹1.5 Lakh/family direct bank compensation released. Physical documents verification roster active at Tehsil Desk #3.',
                coordinates: { lat: 30.556, lng: 79.563 },
                radiusKm: 3.5,
                telemetry: 'Oct 12 Deadline • 384/412 Disbursed (₹6.18 Cr)',
                timeAgo: 'Active Roster',
                entityKey: 'gazette',
                isGazetteModal: true,
              },
            ];

            return (
              <div className="space-y-3">
                {/* Statutory Directives Legend Banner (Mirroring AI Predictions Banner) */}
                <div className="p-3 rounded-2xl bg-surface-container border border-red-200 dark:border-red-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                      <span className="material-symbols-outlined text-sm">gavel</span>
                      <span>Statutory Directives & Disaster Act Orders</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200">
                      DMA 2005
                    </span>
                  </div>

                  {/* Statutory Classification Bands */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                    <div className="p-1 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border border-red-300 dark:border-red-700">
                      <span className="block text-[9px] opacity-75">Section 144</span>
                      <span className="text-red-700 dark:text-red-300 font-extrabold">Critical Evac</span>
                    </div>
                    <div className="p-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      <span className="block text-[9px] opacity-75">Highway Cut</span>
                      <span className="text-amber-700 dark:text-amber-300 font-extrabold">Severe Slip</span>
                    </div>
                    <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      <span className="block text-[9px] opacity-75">Gazette DBT</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">Ex-Gratia</span>
                    </div>
                  </div>
                </div>

                {/* Unified Government Directive Cards (Identical Layout to AI Prediction Cards) */}
                <div className="space-y-2.5">
                  {govDirectiveItems.map((item) => {
                    const theme = getGovDirectiveTheme(item.severity, item.orderType);
                    const distKm = calculateHaversineDistanceKm(
                      effectiveGps.lat,
                      effectiveGps.lng,
                      item.coordinates.lat,
                      item.coordinates.lng
                    );
                    const bufferKm = item.radiusKm + 20.0;
                    const isWithinBuffer = distKm <= bufferKm;
                    const isInsideDirectImpact = distKm <= item.radiusKm;

                    return (
                      <div
                        key={item.id}
                        className={`group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 ${theme.borderClass} shadow-xs transition-all space-y-2`}
                        onClick={() => {
                          if (item.isGazetteModal && onOpenRehabilitationModal) {
                            onOpenRehabilitationModal();
                          } else {
                            onSelectEntity(item.entityKey);
                          }
                        }}
                      >
                        {/* 1. Top Header with Severity Badge & Time/Code */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${theme.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-white ${theme.bandLabel.includes('CRITICAL') ? 'animate-ping' : ''}`} />
                            {theme.bandLabel} • {item.orderType.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                            {item.timeAgo}
                          </span>
                        </div>

                        {/* 2. Title & Authority Subtitle with Right-Hand Emblem Icon */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                              Authority: {item.authority}
                            </p>
                          </div>
                          <span className={`material-symbols-outlined text-lg ${theme.accentColor} shrink-0`}>
                            {theme.icon}
                          </span>
                        </div>

                        {/* 3. Directive Description Body */}
                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {/* 4. Two-Tier Impact Radii Comparison Panel (identical to AI prediction card) */}
                        <div className="mt-2.5 p-2 rounded-xl bg-surface-container/70 border border-outline-variant/60 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-bold text-on-surface">
                              <span className={`w-2 h-2 rounded-full border border-red-600 bg-red-500/40`} />
                              1. Enforced Ground Red Zone:
                            </span>
                            <span className={`font-mono font-bold ${theme.accentColor}`}>
                              {item.radiusKm.toFixed(1)} km (Mandatory Cordon)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-semibold text-outline">
                              <span className="w-2 h-2 rounded-full border border-dashed border-zinc-400" />
                              2. Citizen Tracking Buffer:
                            </span>
                            <span className="font-mono font-bold text-on-surface">
                              {bufferKm.toFixed(1)} km (+20km Perimeter)
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-0.5 border-t border-outline-variant/30 text-[9px]">
                            <span className="text-outline font-mono">User GPS Proximity:</span>
                            {isInsideDirectImpact ? (
                              <span className="font-bold text-error flex items-center gap-1 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                                INSIDE IMPACT ZONE ({distKm.toFixed(1)} km)
                              </span>
                            ) : isWithinBuffer ? (
                              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                WITHIN 20KM BUFFER ({distKm.toFixed(1)} km)
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                SAFE PERIMETER ({distKm.toFixed(1)} km away)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 5. Telemetry & Action Footer */}
                        <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold">
                          <span className={`font-mono ${theme.accentColor}`}>
                            {item.telemetry}
                          </span>
                          <span className="text-primary group-hover:underline flex items-center gap-0.5 font-sans shrink-0">
                            {item.isGazetteModal ? 'View Gazette Roster' : 'View Directive Dossier'}{' '}
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: AI PREDICTIONS ONLY (NO LIVE DISASTER STREAM, PURPLE / BLUE / LIGHT-BLUE THEME) */}
          {mode1Filter === 'ai' && (
            <div className="space-y-3">
              {/* AI Color Theme Legend Banner */}
              <div className="p-3 rounded-2xl bg-surface-container border border-purple-200 dark:border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    <span>AI Geotechnical & Hydro Forecasts</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                    Physics-AI
                  </span>
                </div>

                {/* Score Color Legend Bands */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                  <div className="p-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    <span className="block text-[9px] opacity-75">70 - 100</span>
                    <span className="text-purple-700 dark:text-purple-300 font-extrabold">Purple Theme</span>
                  </div>
                  <div className="p-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                    <span className="block text-[9px] opacity-75">40 - 69.9</span>
                    <span className="text-blue-700 dark:text-blue-300 font-extrabold">Blue Theme</span>
                  </div>
                  <div className="p-1 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border border-sky-300 dark:border-sky-700">
                    <span className="block text-[9px] opacity-75">0 - 39.9</span>
                    <span className="text-sky-700 dark:text-sky-300 font-extrabold">Light-Blue</span>
                  </div>
                </div>
              </div>

              {/* Pure AI Prediction Cards */}
              <div className="space-y-2.5">
                {AI_PREDICTIONS.map((ai) => {
                  const govOrder =
                    checkLocationHasActiveGovOrder(ai.sector, ai.coordinates) ||
                    checkLocationHasActiveGovOrder(ai.entityKey, ai.coordinates);

                  if (govOrder) {
                    return (
                      <div
                        key={ai.id}
                        className="group cursor-pointer p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-600 shadow-xs transition-all space-y-2"
                        onClick={() => onSelectEntity(ai.entityKey)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                            <span className="material-symbols-outlined text-xs">policy</span>
                            GOV ORDER ENFORCED • AI BYPASSED
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                            {govOrder.order_code || govOrder.id || 'UK-SEC144'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                            {ai.name}
                          </h4>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                            <span className="font-semibold text-amber-900 dark:text-amber-200">
                              Active State Order:{' '}
                            </span>
                            {govOrder.directiveText || 'Enforced evacuation order active.'}
                          </p>
                        </div>

                        {/* Two-Tier Status Explaining Government Supercedence */}
                        <div className="p-2 rounded-xl bg-surface/90 border border-outline-variant/60 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-on-surface flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-600" />
                              1. Enforced Ground Red Zone:
                            </span>
                            <span className="font-mono font-bold text-red-600">
                              {ai.realImpactRadiusKm} km (Mandatory Evacuation)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-500">
                            <span className="font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full border border-dashed border-zinc-400" />
                              2. Speculative AI Forewarning:
                            </span>
                            <span className="font-mono italic">
                              Bypassed (Locked to State Mandate)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/60 text-[11px] font-bold text-primary">
                          <span className="font-mono text-[10px] text-on-surface-variant">
                            Auth: {govOrder.authority || 'District Magistrate'}
                          </span>
                          <span className="group-hover:underline flex items-center gap-0.5">
                            View Directive &amp; Dossier{' '}
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const theme = getAiTheme(ai.riskScore);

                  return (
                    <div
                      key={ai.id}
                      className={`group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 ${theme.borderClass} shadow-xs transition-all`}
                      onClick={() => onSelectEntity(ai.entityKey)}
                    >
                      {/* Top Header with AI Score Badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${theme.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-white ${ai.riskScore >= 70 ? 'animate-ping' : ''}`} />
                          {theme.bandLabel} • SCORE {ai.riskScore}/100
                        </span>
                        <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                          {ai.timeHorizon}
                        </span>
                      </div>

                      {/* AI Prediction Title & Model Name */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                            {ai.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                            Model: {ai.modelName}
                          </p>
                        </div>
                        <span className={`material-symbols-outlined text-lg ${theme.accentColor} shrink-0`}>
                          {ai.icon}
                        </span>
                      </div>

                      {/* Prediction Summary Body */}
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                        {ai.predictionSummary}
                      </p>

                      {/* Two-Tier Impact Radii Comparison Panel */}
                      <div className="mt-2.5 p-2 rounded-xl bg-surface-container/70 border border-outline-variant/60 text-[10px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-bold text-on-surface">
                            <span className="w-2 h-2 rounded-full border border-red-600 bg-red-500/40" />
                            1. Real Ground Radius (Red/Yellow/Green):
                          </span>
                          <span className="font-mono font-bold" style={{ color: ai.realColorHex }}>
                            {ai.realImpactRadiusKm} km ({ai.realZoneLabel})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-1 font-bold ${theme.accentColor}`}>
                            <span className={`w-2 h-2 rounded-full border border-dashed ${theme.borderClass} ${theme.pingColor}`} />
                            2. AI Predicted Radius (Purple/Blue/Light-Blue):
                          </span>
                          <span className={`font-mono font-bold ${theme.accentColor}`}>
                            {ai.impactRadiusKm} km ({theme.bandLabel})
                          </span>
                        </div>
                      </div>

                      {/* Telemetry & Action Footer */}
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold">
                        <span className={`font-mono ${theme.accentColor}`}>
                          {ai.telemetryNote}
                        </span>
                        <span className="text-primary group-hover:underline flex items-center gap-0.5 font-sans shrink-0">
                          View AI Model <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL UPDATES (ONLY WITHIN 20KM RANGE AFTER IMPACT RADIUS) */}
          {mode1Filter === 'updates' && (
            <div className="space-y-3">
              {/* GPS Live Status Banner */}
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-sm">my_location</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">
                      Live GPS Proximity Filter
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {effectiveGps.lat.toFixed(4)}° N, {effectiveGps.lng.toFixed(4)}° E
                      {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ''}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-[10px] font-mono font-bold">
                  +20km Buffer
                </span>
              </div>

              {/* Explanatory Rule Subhead */}
              <div className="text-[11px] text-on-surface-variant px-0.5 leading-tight">
                Showing hazards within <span className="font-bold text-on-surface">20 km beyond impact radius</span> (d ≤ R + 20km).
              </div>

              {/* Alerts List Within Range */}
              {localUpdatesWithinRange.length > 0 ? (
                <div className="space-y-2.5">
                  {localUpdatesWithinRange.map((alert) => (
                    <div
                      key={`local-update-${alert.id}`}
                      className={`group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 ${alert.borderClass} shadow-xs transition-all`}
                      onClick={() => onSelectEntity(alert.id)}
                    >
                      {/* Proximity Status Badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        {alert.isInsideImpactRadius ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            CRITICAL • WITHIN IMPACT RADIUS ({alert.distanceKm.toFixed(1)} km)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            BUFFER ADVISORY • +{alert.bufferDeltaKm.toFixed(1)} km OUTSIDE PERIMETER
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          {alert.timeAgo}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                        {alert.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                        {alert.desc}
                      </p>

                      {/* Distance & Real Impact Radius Footer */}
                      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold">
                        <span className="text-on-surface font-mono flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${alert.isInsideImpactRadius ? 'bg-error animate-ping' : 'bg-amber-500'}`} />
                          Real Radius: {alert.impactRadiusKm} km • {alert.distanceKm.toFixed(1)} km from GPS
                        </span>
                        <span className="text-primary group-hover:underline flex items-center gap-0.5 shrink-0">
                          View On Map <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* All Clear Card when outside 20km range */
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    All Clear in 20km Buffer Zone
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Your real-time GPS position ({effectiveGps.lat.toFixed(4)}° N, {effectiveGps.lng.toFixed(4)}° E) is currently outside all active disaster impact perimeters and their surrounding 20 km advisory buffer zones.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold border-t border-emerald-200 dark:border-emerald-800/50">
                    Nearest hazard: Pipalkoti Corridor (&gt; 28 km)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: RELOCATION & LIFELINES */}
      {currentMode === 2 && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 tactical-scroll">
          {/* Sub Tabs inside Mode 2 */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full text-xs font-bold sticky top-0 z-10 backdrop-blur-md">
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'queues'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('queues')}
              type="button"
            >
              Habitations
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'shelters'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('shelters')}
              type="button"
            >
              Safe Shelters
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'timelines'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('timelines')}
              type="button"
            >
              Gazette
            </button>
          </div>

          {/* Habitations Subpanel - Dynamic Risk Zoning & Relocation Score */}
          {mode2SubTab === 'queues' && (
            <div className="space-y-3">
              {/* Dynamic Risk Zoning Overview & 0-100 Score Scale */}
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/80 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">emergency_home</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Dynamic Risk Zoning
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                  </span>
                </div>

                {/* 3-Zone Classification Metrics */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                  <button
                    className={`py-1.5 px-1 rounded-xl border transition-all flex flex-col items-center cursor-pointer ${
                      zoneFilter === 'RED'
                        ? 'bg-error text-white border-error shadow-sm scale-102'
                        : 'bg-error/10 text-error border-error/30 hover:bg-error/20'
                    }`}
                    onClick={() => setZoneFilter(zoneFilter === 'RED' ? 'ALL' : 'RED')}
                    type="button"
                  >
                    <span className="text-xs font-black">{redCount}</span>
                    <span>RED ZONE</span>
                    <span className="text-[9px] font-normal opacity-85">Immediate</span>
                  </button>
                  <button
                    className={`py-1.5 px-1 rounded-xl border transition-all flex flex-col items-center cursor-pointer ${
                      zoneFilter === 'YELLOW'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm scale-102'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                    onClick={() => setZoneFilter(zoneFilter === 'YELLOW' ? 'ALL' : 'YELLOW')}
                    type="button"
                  >
                    <span className="text-xs font-black">{yellowCount}</span>
                    <span>YELLOW ZONE</span>
                    <span className="text-[9px] font-normal opacity-85">Prepare & Monitor</span>
                  </button>
                  <button
                    className={`py-1.5 px-1 rounded-xl border transition-all flex flex-col items-center cursor-pointer ${
                      zoneFilter === 'GREEN'
                        ? 'bg-[#2e7d32] text-white border-[#2e7d32] shadow-sm scale-102'
                        : 'bg-[#2e7d32]/10 text-[#2e7d32] dark:text-emerald-400 border-[#2e7d32]/30 hover:bg-[#2e7d32]/20'
                    }`}
                    onClick={() => setZoneFilter(zoneFilter === 'GREEN' ? 'ALL' : 'GREEN')}
                    type="button"
                  >
                    <span className="text-xs font-black">{greenCount}</span>
                    <span>GREEN ZONE</span>
                    <span className="text-[9px] font-normal opacity-85">Normal Mon.</span>
                  </button>
                </div>

                {/* 0 - 100 RISK SCORE BAR GAUGE */}
                <div className="pt-2 border-t border-outline-variant/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant mb-1 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400">0 LOW RISK</span>
                    <span className="text-amber-600 dark:text-amber-400">50 MODERATE</span>
                    <span className="text-error">100 HIGH RISK</span>
                  </div>
                  {/* Tri-color horizontal gauge gradient */}
                  <div className="h-2 rounded-full w-full bg-linear-to-r from-emerald-500 via-amber-400 to-red-600 shadow-inner relative overflow-hidden" />
                  <div className="flex items-center justify-between text-[9px] text-on-surface-variant font-medium mt-1">
                    <span>Safe / Monitoring</span>
                    <span>Prepare & Monitor</span>
                    <span>Immediate Relocation</span>
                  </div>
                </div>
              </div>

              {/* Priority Queue Header with total families count */}
              <div className="flex items-center justify-between text-xs font-bold px-0.5">
                <span className="text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Relocation Priority Queue
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-mono text-[10px]">
                  {totalFamilies.toLocaleString()} Families
                </span>
              </div>

              {/* Dynamic Habitations List */}
              <div className="space-y-2.5">
                {filteredHabitations.map((hab) => {
                  const isRed = hab.zone === 'RED';
                  const isYellow = hab.zone === 'YELLOW';
                  const borderClass = isRed
                    ? 'border-l-4 border-l-error'
                    : isYellow
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-[#2e7d32]';

                  return (
                    <div
                      key={hab.id}
                      className={`p-3 rounded-2xl bg-surface-container-low ${borderClass} border border-outline-variant/70 shadow-xs hover:shadow-md transition-all cursor-pointer group`}
                      onClick={() => onSelectEntity(hab.id)}
                    >
                      {/* Zone Badge & Preparedness Rank */}
                      <div className="flex items-center justify-between mb-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${hab.badgeClass}`}>
                          {isRed && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                          {hab.zone} ZONE • PRIORITY #{hab.priorityRank}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {hab.affectedFamilies > 0 ? `${hab.affectedFamilies} Families` : 'Safe Staging Site'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                            {hab.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                            {hab.district} • {hab.baseGeology}
                          </p>
                        </div>
                        {/* 0-100 Numerical Score Display */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-black font-mono leading-none" style={{ color: hab.color }}>
                            {hab.riskScore}
                          </div>
                          <div className="text-[9px] font-mono text-on-surface-variant">/ 100 SCORE</div>
                        </div>
                      </div>

                      {/* 0-100 Horizontal Gauge Needle Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] font-bold text-on-surface-variant mb-0.5">
                          <span>RISK SCORE GAUGE</span>
                          <span style={{ color: hab.color }}>{hab.riskLevel}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(3, hab.riskScore))}%`,
                              backgroundColor: hab.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Relocation Preparedness & Action Protocol */}
                      <div className="mt-2 p-2 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                        <div className="text-[10px] font-bold flex items-center gap-1 text-on-surface">
                          <span className="material-symbols-outlined text-xs" style={{ color: hab.color }}>
                            {isRed ? 'warning' : isYellow ? 'schedule' : 'check_circle'}
                          </span>
                          <span className="font-heading">{hab.relocationPreparedness}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug line-clamp-2">
                          {hab.actionProtocol}
                        </p>
                      </div>

                      {/* Real Live Multi-Hazard Telemetry Values */}
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[10px] font-bold">
                        <span className="font-mono" style={{ color: hab.color }}>
                          FoS: {hab.liveTelemetry?.factorOfSafety?.toFixed(2) ?? '0.84'}{' '}
                          <span className="text-[9px] text-on-surface-variant font-sans">
                            ({Math.round(hab.liveTelemetry?.soilSatPct ?? 60)}% Sat | Rain: {Math.round(hab.liveTelemetry?.rainMmh ?? 0)}mm)
                          </span>
                        </span>
                        <span className="text-primary group-hover:underline flex items-center gap-0.5">
                          Inspect Details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safe Shelters Subpanel */}
          {mode2SubTab === 'shelters' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface px-0.5">
                <span>Active Safe Shelters</span>
                <span className="px-2 py-0.5 rounded-full bg-[#2e7d32] text-white text-[10px]">3 Operational</span>
              </div>
              <div
                className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectEntity('shelter_gauchar')}
              >
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                  <span className="text-[#2e7d32] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">night_shelter</span> Terminal 01 (Airstrip)
                  </span>
                  <span className="text-[#2e7d32]">58 Beds Free</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary">
                  Gauchar Field Station Airstrip
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  Primary staging center with triage, helipad, and rations.
                </p>
                <div className="mt-2 text-[11px] font-bold flex justify-between pt-1.5 border-t border-outline-variant/60">
                  <span className="text-on-surface-variant">Capacity: 142/200 (71%)</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>
            </div>
          )}

          {/* Gazette Timelines Subpanel */}
          {mode2SubTab === 'timelines' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface px-0.5">
                <span>Government Gazette Orders</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px]">UK-2024-88</span>
              </div>

              {/* URGENT PHYSICAL DOCUMENT SUBMISSION BUTTON */}
              {onOpenRehabilitationModal && (
                <div
                  className="p-3.5 rounded-2xl bg-error-container text-on-error-container border border-error/30 shadow-md cursor-pointer hover:bg-error-container/90 transition-all group"
                  onClick={onOpenRehabilitationModal}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[11px]">
                    <span className="font-bold flex items-center gap-1 text-error">
                      <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                      ACTION REQUIRED • 14 DAYS LEFT
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px]">
                      Mandatory
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm">
                    Physical Submission of Land Deeds & Khatauni
                  </h4>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">
                    Submit original papers at SDM Desk #3 to secure permanent compensation & replacement plots.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-error/20 text-[11px] font-bold">
                    <span>Tehsil Desk #3</span>
                    <span className="group-hover:underline flex items-center gap-1">
                      Open Roster & Checklist <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                </div>
              )}

              <div
                className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => (onOpenRehabilitationModal ? onOpenRehabilitationModal() : onSelectEntity('gazette'))}
              >
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">history_edu</span> Relief & Compensation
                  </span>
                  <span className="text-on-surface-variant font-mono">Oct 12 Target</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-on-surface group-hover:text-primary">
                  Phase 1 DBT Ex-gratia Disbursement
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  ₹1.5 Lakh/family direct bank transfer to 412 red-tagged households.
                </p>
                <div className="mt-2 text-[11px] font-bold flex justify-between pt-1.5 border-t border-outline-variant/60">
                  <span className="text-on-surface-variant">412 Beneficiaries</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-outline-variant/80 bg-surface-container/60 backdrop-blur-sm flex flex-col gap-2">
        {currentMode === 2 && (
          <button
            className="w-full py-2.5 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            onClick={onOpenVolunteerModal}
            type="button"
          >
            <span className="material-symbols-outlined text-base">assignment_ind</span>
            <span>Apply as Volunteer</span>
          </button>
        )}
        <div className="flex items-center justify-between text-xs font-bold px-1 text-on-surface-variant">
          <button
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={onOpenMapSettings}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">tune</span> Map Settings
          </button>
          <button
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={() => alert('Legend: Red=Active Landslide/Flooding; Green=Verified Safe Route & Shelter')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">layers</span> Legend Layers
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TacticalDrawer;
