import React, { useState, useRef, useCallback } from 'react';
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

  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const currentEntity: HazardEntity = USER_ENTITIES[selectedEntityKey] || USER_ENTITIES['joshimath'];

  const handleSelectEntity = (key: string) => {
    setSelectedEntityKey(key);
    setIsDetailsOpen(true);
    const entity = USER_ENTITIES[key];
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

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-surface text-on-surface font-sans">
      {/* 1. Base Layer Google Map Canvas with Polylines & Live Markers */}
      <MapCanvas
        currentMode={currentMode}
        mapTypeId={currentMapType}
        layers={layers}
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
      <SosBlock />

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
      />

      {/* 11. Volunteer Application Modal */}
      <VolunteerApplicationModal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
      />
    </div>
  );
};

export default UserMapHudPage;
