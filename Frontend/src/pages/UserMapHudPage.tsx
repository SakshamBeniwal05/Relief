import React, { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../api';
import {
  UserNavbar,
  TacticalDrawer,
  DetailSidebar,
  RadarHudCard,
  MapControls,
  SosBlock,
  MapCanvas,
  MapSettingsModal,
  VolunteerApplicationModal,
  CreateReportModal,
  FullReportModal,
  USER_ENTITIES,
} from '../user';
import type { ModeType, HazardEntity, GoogleMapType, MapLayerSettings } from '../user';

interface ShelterRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  totalBeds: number;
  occupiedBeds: number;
  medicalStaffCount: number;
  waterReserveLiters: number;
  dryRationsDays: number;
  guidelinesText: string;
}

interface HabitationRecord {
  id: string;
  name: string;
  populationTotal: number;
  relocationPhase: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
}

interface TimelineRecord {
  id: string;
  gazetteNoticeTitle: string;
  administrativeOrderNo: string;
  surveyDeadline: string;
  requiredDocuments: string[];
}

interface VerifiedIncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: string;
  latitude: number;
  longitude: number;
}

interface EntityEntry {
  key: string;
  entity: HazardEntity;
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const hazardKey = (entity: HazardEntity) => {
  const value = `${entity.id} ${entity.title}`.toLowerCase();
  if (value.includes('joshimath')) return 'joshimath';
  if (value.includes('alak') || value.includes('pipalkoti surge')) return 'alaknanda';
  if (value.includes('nh58') || value.includes('nh-58') || value.includes('chamoli')) return 'chamoli';
  return slug(entity.title || entity.id);
};

const shelterEntity = (shelter: ShelterRecord): HazardEntity => ({
  id: shelter.id,
  category: 'SAFE TERMINAL • VERIFIED',
  badgeClass: 'bg-[#2e7d32]/20 text-[#1b5e20]',
  title: shelter.name,
  meta: `${shelter.medicalStaffCount} medical staff • ${shelter.dryRationsDays} ration days`,
  desc: `Capacity ${shelter.occupiedBeds}/${shelter.totalBeds}. ${shelter.waterReserveLiters.toLocaleString()}L potable water reserve.`,
  telemetry: {
    fos: `${shelter.totalBeds - shelter.occupiedBeds} beds free`,
    rain: 'N/A',
    sat: `${Math.round((shelter.occupiedBeds / shelter.totalBeds) * 100)}% occupied`,
    pore: `${shelter.waterReserveLiters.toLocaleString()} L water`,
    tilt: `${shelter.medicalStaffCount} medical staff`,
  },
  directives: shelter.guidelinesText,
  img1: '',
  img2: '',
  coordinates: { lat: shelter.latitude, lng: shelter.longitude },
});

const habitationEntity = (habitation: HabitationRecord): HazardEntity => ({
  id: habitation.id,
  category: `RELOCATION • ${habitation.relocationPhase.replaceAll('_', ' ')}`,
  badgeClass: 'bg-tertiary-container text-on-tertiary-container',
  title: habitation.name,
  meta: `${habitation.populationTotal.toLocaleString()} residents`,
  desc: `Relocation priority score ${habitation.priorityScore}/100.`,
  telemetry: { fos: `${habitation.priorityScore} Priority`, rain: 'N/A', sat: 'N/A', pore: 'N/A', tilt: 'N/A' },
  directives: 'Follow district administration relocation instructions.',
  img1: '',
  img2: '',
  coordinates: { lat: habitation.latitude, lng: habitation.longitude },
});

const timelineEntity = (timeline: TimelineRecord): HazardEntity => ({
  id: timeline.id,
  category: 'GAZETTE NOTIFICATION',
  badgeClass: 'bg-primary-fixed text-on-primary-fixed',
  title: timeline.gazetteNoticeTitle,
  meta: timeline.administrativeOrderNo,
  desc: `Survey deadline: ${timeline.surveyDeadline}. Required documents: ${timeline.requiredDocuments.join(', ')}.`,
  telemetry: { fos: 'Government order', rain: 'N/A', sat: 'N/A', pore: timeline.requiredDocuments.length.toString(), tilt: timeline.surveyDeadline },
  directives: `Submit required documents by ${timeline.surveyDeadline}.`,
  img1: '',
  img2: '',
});

export const UserMapHudPage: React.FC = () => {

  const [currentMode, setCurrentMode] = useState<ModeType>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('joshimath');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<GoogleMapType>('roadmap');
  const [layers, setLayers] = useState<MapLayerSettings>({
    river: true,
    highway: true,
    evacRoute: true,
    pins: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [entities, setEntities] = useState<Record<string, HazardEntity>>(USER_ENTITIES);
  const [habitations, setHabitations] = useState<EntityEntry[]>([]);
  const [shelters, setShelters] = useState<EntityEntry[]>([]);
  const [timelines, setTimelines] = useState<EntityEntry[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const currentEntity: HazardEntity = entities[selectedEntityKey] || Object.values(entities)[0] || USER_ENTITIES['joshimath'];

  const refreshData = useCallback(async () => {
    try {
      const [hazardData, shelterData, habitationData, timelineData, incidentData] = await Promise.all([
        apiRequest<HazardEntity[]>('/hazards'),
        apiRequest<ShelterRecord[]>('/shelters'),
        apiRequest<HabitationRecord[]>('/habitations'),
        apiRequest<TimelineRecord[]>('/timelines'),
        apiRequest<VerifiedIncidentRecord[]>('/incidents'),
      ]);
      const nextEntities: Record<string, HazardEntity> = {};
      hazardData.forEach((entity) => { nextEntities[hazardKey(entity)] = entity; });
      const shelterEntries = shelterData.map((item) => ({ key: `shelter_${slug(item.id)}`, entity: shelterEntity(item) }));
      const habitationEntries = habitationData.map((item) => ({ key: `habitation_${slug(item.id)}`, entity: habitationEntity(item) }));
      const timelineEntries = timelineData.map((item) => ({ key: `timeline_${slug(item.id)}`, entity: timelineEntity(item) }));
      const incidentEntries = incidentData.map((incident) => ({
        key: `incident_${slug(incident.id)}`,
        entity: {
          id: incident.id,
          category: incident.severity,
          badgeClass: 'bg-error-container text-on-error-container',
          title: incident.title,
          meta: 'Verified community incident',
          desc: incident.description,
          telemetry: { fos: 'Verified', rain: 'N/A', sat: 'N/A', pore: 'N/A', tilt: 'N/A' },
          directives: 'Incident verified by the administration and published to the public map.',
          img1: '',
          img2: '',
          coordinates: { lat: incident.latitude, lng: incident.longitude },
        } satisfies HazardEntity,
      }));
      shelterEntries.forEach(({ key, entity }) => { nextEntities[key] = entity; });
      habitationEntries.forEach(({ key, entity }) => { nextEntities[key] = entity; });
      timelineEntries.forEach(({ key, entity }) => { nextEntities[key] = entity; });
      incidentEntries.forEach(({ key, entity }) => { nextEntities[key] = entity; });
      setEntities(nextEntities);
      setShelters(shelterEntries);
      setHabitations(habitationEntries);
      setTimelines(timelineEntries);
      setApiError(null);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Backend connection failed.');
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void refreshData(); }, 0);
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);
    socket.on('incident:created', refreshData);
    socket.on('incident:updated', refreshData);
    socket.on('directive:created', refreshData);
    return () => {
      window.clearTimeout(initialLoad);
      socket.disconnect();
    };
  }, [refreshData]);

  const handleSelectEntity = (key: string) => {
    setSelectedEntityKey(key);
    setIsDetailsOpen(true);
    const entity = entities[key];
    if (entity?.coordinates) {
      setTargetCoords(entity.coordinates);
      mapInstanceRef.current?.panTo(entity.coordinates);
      mapInstanceRef.current?.setZoom(13);
    }
  };

  const handleCanvasClick = () => {
    setIsDetailsOpen(false);
  };

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 11) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 11) - 1);
    }
  };

  const handleRecenterGPS = () => {
    const center = { lat: 30.45, lng: 79.36 };
    mapInstanceRef.current?.panTo(center);
    mapInstanceRef.current?.setZoom(11);
  };

  const handleCenterOnEntity = () => {
    if (currentEntity?.coordinates) {
      mapInstanceRef.current?.panTo(currentEntity.coordinates);
      mapInstanceRef.current?.setZoom(14);
    }
  };

  const handleToggleLayer = (layer: keyof MapLayerSettings) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const sendSosPacket = async () => {
    if (!navigator.geolocation) throw new Error('This browser cannot provide your location for the SOS packet.');
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }).catch(() => {
      throw new Error('Location access is required to send a geolocated SOS packet.');
    });
    const deviceHash = localStorage.getItem('relief_device_hash') || crypto.randomUUID();
    localStorage.setItem('relief_device_hash', deviceHash);
    await apiRequest('/sos/sync', {
      method: 'POST',
      body: JSON.stringify({
        packets: [{
          deviceHash,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          payloadText: 'Emergency SOS: Request assistance',
          hopsCount: 0,
        }],
      }),
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-surface text-on-surface font-sans">
      {/* 1. Base Layer Google Map Canvas with Polylines & Live Markers */}
      <MapCanvas
        currentMode={currentMode}
        mapTypeId={currentMapType}
        layers={layers}
        entities={Object.entries(entities).map(([key, entity]) => ({ key, entity }))}
        onSelectEntity={handleSelectEntity}
        onCanvasClick={handleCanvasClick}
        onMapLoad={handleMapLoad}
        targetCoordinates={targetCoords}
      />

      {/* 2. Floating Top HUD App Bar */}
      <UserNavbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onToggleRadar={() => setIsRadarOpen(!isRadarOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenProfile={() => alert('NDRF Nodal Field Commander Profile')}
      />

      {/* 3. Floating Tactical Command Drawer (Left) */}
      <TacticalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentMode={currentMode}
        onSelectEntity={handleSelectEntity}
        onOpenVolunteerModal={() => setIsVolunteerModalOpen(true)}
        onOpenMapSettings={() => setIsMapSettingsOpen(true)}
        hazards={Object.entries(entities).filter(([, entity]) => !entity.category.startsWith('SAFE TERMINAL') && !entity.category.startsWith('RELOCATION') && !entity.category.startsWith('GAZETTE')).map(([key, entity]) => ({ key, entity }))}
        shelters={shelters}
        habitations={habitations}
        timelines={timelines}
      />

      {/* 4. Secondary Floating Details Sidebar (Left - dynamically adjacent when drawer is open, or in primary position when closed) */}
      <DetailSidebar
        entity={currentEntity}
        isOpen={isDetailsOpen}
        isSidebarOpen={isDrawerOpen}
        onClose={() => setIsDetailsOpen(false)}
        onExpandReport={() => setIsReportModalOpen(true)}
        onCenterMap={handleCenterOnEntity}
      />

      {/* 5. Floating Radar HUD Card (Right) */}
      <RadarHudCard
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />

      {/* 6. Floating Map Controls (Bottom Right) */}
      <div className="fixed bottom-20 right-5 z-40">
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRecenterGPS={handleRecenterGPS}
          onOpenMapSettings={() => setIsMapSettingsOpen(true)}
        />
      </div>

      {/* 7. Crisis SOS Trigger & Dispatch Drawer (Bottom Right) */}
      <SosBlock onSosBroadcast={sendSosPacket} />

      {/* 8. Map Settings & Map View Selector Modal (Satellite, Terrain, Hybrid, Roadmap) */}
      <MapSettingsModal
        isOpen={isMapSettingsOpen}
        onClose={() => setIsMapSettingsOpen(false)}
        currentMapType={currentMapType}
        onSelectMapType={(type) => setCurrentMapType(type)}
        layers={layers}
        onToggleLayer={handleToggleLayer}
      />

      {/* 9. Full Incident Report Dossier Modal */}
      <FullReportModal
        entity={currentEntity}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onOpenCreateReport={() => setIsCreateReportOpen(true)}
      />

      {/* 10. Create Report / Geo-Cam Evidence Submission Modal */}
      <CreateReportModal
        isOpen={isCreateReportOpen}
        onClose={() => setIsCreateReportOpen(false)}
        defaultSector={currentEntity.title}
        onSubmitReport={async (report) => {
          const coordinates = currentEntity.coordinates ?? { lat: 30.5562, lng: 79.5638 };
          await apiRequest('/incidents', {
            method: 'POST',
            body: JSON.stringify({
              targetSector: report.targetSector,
              observationNotes: report.observationNotes,
              latitude: coordinates.lat,
              longitude: coordinates.lng,
            }),
          });
        }}
      />

      {/* 11. Volunteer Application Modal */}
      <VolunteerApplicationModal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
        onSubmitApplication={async (data) => {
          await apiRequest('/volunteers', { method: 'POST', body: JSON.stringify(data) });
        }}
      />
      {apiError && (
        <div role="status" className="fixed right-4 top-20 z-40 max-w-sm rounded-xl border border-error/30 bg-surface-container-lowest/95 px-4 py-3 text-xs text-error shadow-lg">
          Backend unavailable: {apiError}
        </div>
      )}
    </div>
  );
};

export default UserMapHudPage;
