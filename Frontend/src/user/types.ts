export interface HazardEntity {
  id: string;
  category: string;
  badgeClass: string;
  title: string;
  meta: string;
  desc: string;
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
}

export type ModeType = 1 | 2; // 1: Threat Radar, 2: Relocation & Lifelines
export type Mode1Filter = 'official' | 'ai' | 'updates';
export type Mode2SubTab = 'queues' | 'shelters' | 'timelines';

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

export const USER_MODULE_INITIALIZED = true;
