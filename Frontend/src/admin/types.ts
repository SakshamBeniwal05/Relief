export interface VolunteerApplicant {
  id: string;
  name: string;
  phone: string;
  govId: string;
  specialization: string;
  specializationType: 'medical' | 'vehicle' | 'radio' | 'rescue';
  sector: string;
  availability: string;
  verificationBadge: string;
  status: 'pending' | 'approved' | 'deployed' | 'rejected';
}

export interface GeoIncident {
  id: string;
  title: string;
  severity: 'HIGH SEVERITY' | 'MEDIUM RISK' | 'LOW RISK';
  locationText: string;
  coordinates: string;
  timeAgo: string;
  photoUrl: string;
  gpsDelta: string;
  hardwareClockStatus: string;
  cvConfidence: number;
  status: 'pending' | 'verified' | 'escalated' | 'dismissed';
}

export interface GazetteOrderPayload {
  orderType: string;
  targetSector: string;
  directiveText: string;
  pushBleMeshSiren: boolean;
  coordinates?: { lat: number; lng: number };
  threatCategory?: string;
  threatSeverity?: 'CRITICAL' | 'SEVERE' | 'ADVISORY';
  threatRadiusMeters?: number;
  compensationPerFamilyInr?: number;
  targetFamilies?: number;
  deadlineDate?: string;
  authority?: string;
}

export interface GeneratedAiDossier {
  report_id: string;
  order_code: string;
  sector_name: string;
  coordinates: { lat: number; lng: number };
  threat_radius_meters: number;
  threat_category: string;
  threat_severity: string;
  detected_threat_signature?: string;
  live_weather: {
    temp_c: number;
    rain_mmh: number;
    humidity_pct: number;
    soil_saturation_pct: number;
    source: string;
  };
  geotechnical_analysis: {
    factor_of_safety: number;
    hazard_score: number;
    alert_level: string;
    sec144_enforceable: boolean;
    recommendation: string;
  };
  directives: string;
  sign_off: {
    nodal_officer: string;
    approval_stamp: string;
    timestamp?: string;
  };
  compensation?: {
    per_family_inr: number;
    target_families: number;
    total_budget_cr: number;
    deadline_date: string;
  };
}

export interface ActivityLogItem {
  id: string;
  title: string;
  authInfo: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface HeroStatMetric {
  title: string;
  value: string;
  badge: string;
  badgeType: 'error' | 'neutral' | 'success';
  subtitle: string;
  footerText: string;
  actionText?: string;
  icon: string;
}

export const ADMIN_MODULE_INITIALIZED = true;
