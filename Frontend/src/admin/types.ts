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
