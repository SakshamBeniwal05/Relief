export interface HazardEntity {
  id: string;
  category: string;
  badgeClass: string;
  title: string;
  meta: string;
  desc: string;
  riskScore?: number;
  zone?: 'RED' | 'YELLOW' | 'GREEN';
  riskLevel?: string;
  relocationPreparedness?: string;
  priorityRank?: number;
  actionProtocol?: string;
  telemetry: {
    fos: string;
    rain: string;
    sat: string;
    pore: string;
    tilt: string;
  };
  directives: string;
  img1: string;
  img2: string;
  coordinates?: { lat: number; lng: number };
  coreRadiusMeters?: number;
  impactRadiusMeters?: number;
  concentricRings?: ConcentricRing[];
}

export interface HabitationRiskProfile {
  id: string;
  name: string;
  district: string;
  coordinates: { lat: number; lng: number };
  slopeAngleDeg: number;
  soilCohesionKpa: number;
  failureDepthM: number;
  affectedFamilies: number;
  structuresRedFlagged: number;
  isRiverToeSector: boolean;
  baseGeology: string;
  riskScore: number;
  zone: 'RED' | 'YELLOW' | 'GREEN';
  riskLevel: 'HIGH RISK' | 'MODERATE RISK' | 'LOW RISK';
  relocationPreparedness: 'Prepare for Immediate Relocation' | 'Prepare & Monitor' | 'Normal Monitoring';
  priorityRank: number;
  actionProtocol: string;
  color: string;
  badgeClass: string;
  components?: {
    fosPoints: number;
    satPoints: number;
    rainPoints: number;
    seismicPoints: number;
    floodPoints: number;
  };
  liveTelemetry?: {
    tempC: number;
    rainMmh: number;
    humidity: number;
    soilMoistureVol: number;
    soilSatPct: number;
    porePressureKpa: number;
    factorOfSafety: number;
    riverDischargeM3s: number;
    nearestQuake?: {
      magnitude: number;
      distanceKm: number;
    } | null;
  };
}

export interface DynamicRiskZoningData {
  updatedAt: string;
  zonesSummary: {
    redCount: number;
    yellowCount: number;
    greenCount: number;
  };
  liveDisasterContext: {
    liveRiverDischargeM3s: number;
    activeQuakesSampled: number;
    source: string;
  };
  habitations: HabitationRiskProfile[];
}

export type ModeType = 1 | 2; // 1: Threat Radar, 2: Relocation & Lifelines
export type Mode1Filter = 'official' | 'ai' | 'updates';
export type Mode2SubTab = 'queues' | 'shelters' | 'timelines';

export interface ConcentricRing {
  tier: number;
  label: string;
  radius: number;
  fillOpacity: number;
  strokeOpacity: number;
  fillColor: string;
  strokeColor: string;
  strokeWeight: number;
}

export interface LiveDisasterEvent {
  id: string;
  title: string;
  category: 'EARTHQUAKE' | 'FLOOD' | 'DROUGHT' | 'CYCLONE' | 'WILDFIRE' | 'LANDSLIDE';
  severity: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'ADVISORY';
  badgeClass: string;
  source: string;
  coordinates: { lat: number; lng: number };
  depthKm?: number;
  magnitude?: number;
  coreRadiusMeters: number;
  impactRadiusMeters: number;
  concentricRings: ConcentricRing[];
  timestamp: string;
  desc: string;
  telemetry: {
    fos: number | string;
    rain: string;
    sat: string;
    porePressure: string;
    slopeTilt: string;
    liveParam?: string;
  };
}

export interface LiveAtmosphericTelemetry {
  tempC?: number;
  rainMmh: number;
  humidity: number;
  soilMoistureVol: number;
  soilSatPct: number;
  porePressureKpa: number;
  calculatedFos: number;
  hazardScore: number;
  alertLevel: string;
  sec144Enforceable: boolean;
}

export interface RehabilitationDocumentItem {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isMandatoryForPermanentCompensation: boolean;
  verificationAgency: string;
  submissionDesk: string;
  penaltyIfMissing: string;
}

export interface RehabilitationStage {
  stageNumber: number;
  title: string;
  authority: string;
  deadlineDate: string;
  daysRemaining: number;
  isUrgent: boolean;
  status: 'ACTIVE_URGENT' | 'UPCOMING' | 'COMPLETED';
  summary: string;
  actionRequired: string;
  riskIfNotCompleted: string;
}

export interface VolunteerApplicationData {
  fullName: string;
  mobile: string;
  specialization: string;
  notes?: string;
}

export interface GeoEvidenceSubmission {
  targetSector: string;
  observationNotes: string;
  photoUrl?: string;
  location?: string;
}

export interface ActiveRouteData {
  coordinates: Array<{ lat: number; lng: number }>;
  alternativeCoordinates?: Array<Array<{ lat: number; lng: number }>>;
  originCoord: { lat: number; lng: number };
  destCoord: { lat: number; lng: number };
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  midpoint: { lat: number; lng: number };
  mode: 'DRIVING' | 'WALKING';
  altDistance?: string;
  altDuration?: string;
  altMidpoint?: { lat: number; lng: number };
}

export const USER_MODULE_INITIALIZED = true;

