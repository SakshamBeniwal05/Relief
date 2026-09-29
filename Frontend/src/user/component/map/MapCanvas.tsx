import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  PolylineF,
  DirectionsRenderer,
  CircleF,
  OVERLAY_MOUSE_TARGET,
} from '@react-google-maps/api';
import type { ModeType, LiveDisasterEvent, DynamicRiskZoningData, ActiveRouteData } from '../../types';
import type { GoogleMapType, MapLayerSettings } from './MapSettingsModal';
import { checkLocationHasActiveGovOrder, getActiveGovernmentDirectives } from '../../../services/api';

interface MapCanvasProps {
  currentMode: ModeType;
  mapTypeId?: GoogleMapType;
  layers?: MapLayerSettings;
  onSelectEntity: (key: string) => void;
  onCanvasClick?: () => void;
  onMapLoad?: (map: google.maps.Map) => void;
  targetCoordinates?: { lat: number; lng: number } | null;
  userGpsCoords?: { lat: number; lng: number } | null;
  gpsAccuracy?: number | null;
  directionsResult?: google.maps.DirectionsResult | null;
  activeRoute?: ActiveRouteData | null;
  liveDisasters?: LiveDisasterEvent[];
  dynamicRiskData?: DynamicRiskZoningData | null;
}

// Center coordinate for Kedarnath - Alaknanda Valley Basin
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 30.45, lng: 79.36 };

// Required libraries for Google Maps
const MAP_LIBRARIES: ('places' | 'geometry')[] = ['geometry'];

function getDisasterCategoryIcon(category: string): string {
  switch (category) {
    case 'EARTHQUAKE': return 'crisis_alert';
    case 'FLOOD': return 'flood';
    case 'DROUGHT': return 'wb_sunny';
    case 'CYCLONE': return 'cyclone';
    case 'WILDFIRE': return 'local_fire_department';
    case 'VOLCANO': return 'volcano';
    default: return 'warning';
  }
}

function coordsToSvgPercent(lat: number, lng: number) {
  const top = ((32.2 - lat) / 3.2) * 100;
  const left = ((lng - 77.2) / 3.8) * 100;
  return {
    top: `${Math.min(90, Math.max(8, top))}%`,
    left: `${Math.min(92, Math.max(8, left))}%`,
  };
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  currentMode,
  mapTypeId = 'terrain',
  layers = { river: true, highway: true, evacRoute: true, pins: true },
  onSelectEntity,
  onCanvasClick,
  onMapLoad,
  targetCoordinates,
  userGpsCoords,
  gpsAccuracy,
  directionsResult,
  activeRoute,
  liveDisasters = [],
  dynamicRiskData,
}) => {
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const josHab = dynamicRiskData?.habitations?.find((h) => h.id === 'joshimath');
  const pipalHab = dynamicRiskData?.habitations?.find((h) => h.id === 'pipalkoti');
  const chamHab = dynamicRiskData?.habitations?.find((h) => h.id === 'chamoli_km214');
  const sunilHab = dynamicRiskData?.habitations?.find((h) => h.id === 'sunil_ward');
  const gauchHab = dynamicRiskData?.habitations?.find((h) => h.id === 'gauchar_safe');
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [apiKey, setApiKey] = useState<string>(() => {
    return envKey.trim() || localStorage.getItem('gmaps_api_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const mapRef = useRef<google.maps.Map | null>(null);
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

  const hasKey = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');

  // Load Google Maps API Script
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasKey ? apiKey : '',
    libraries: MAP_LIBRARIES,
  });

  const handleMapLoaded = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setMapTypeId(mapTypeId);
      if (onMapLoad) {
        onMapLoad(map);
      }
    },
    [onMapLoad, mapTypeId]
  );

  // Update mapTypeId dynamically when switched
  useEffect(() => {
    if (mapRef.current && mapTypeId) {
      mapRef.current.setMapTypeId(mapTypeId);
    }
  }, [mapTypeId]);

  // Pan to target coordinates when selected
  useEffect(() => {
    if (mapRef.current && targetCoordinates) {
      mapRef.current.panTo(targetCoordinates);
      mapRef.current.setZoom(13);
    }
  }, [targetCoordinates]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      localStorage.setItem('gmaps_api_key', inputKey.trim());
      setApiKey(inputKey.trim());
      setShowKeyModal(false);
    }
  };

  const getOffset = (x: number, y: number) => () => ({
    x,
    y,
  });

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden select-none">
      {/* 1. Google Maps View (when loaded) */}
      {isLoaded && hasKey && !loadError ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={DEFAULT_CENTER}
          zoom={11}
          onLoad={handleMapLoaded}
          onClick={onCanvasClick}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            mapTypeId: mapTypeId,
            backgroundColor: '#f7f2f9',
          }}
        >
          {/* Real Highway Road Route Overlay (Matching Google Maps & Uploaded Design) */}
          {activeRoute && activeRoute.coordinates.length > 0 && (
            <>
              {/* Alternative Route (Lighter Highway Path) */}
              {activeRoute.alternativeCoordinates?.map((altPath, idx) => (
                <PolylineF
                  key={`alt-route-${idx}`}
                  path={altPath}
                  options={{
                    strokeColor: '#9aa0a6',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    zIndex: 14,
                  }}
                />
              ))}

              {/* Alternative Route Badge */}
              {activeRoute.altMidpoint && (
                <OverlayViewF
                  position={activeRoute.altMidpoint}
                  mapPaneName={OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={getOffset(-55, -45)}
                >
                  <div className="bg-white/95 backdrop-blur-sm text-slate-700 px-2.5 py-1 rounded-lg shadow-md border border-slate-300 text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap pointer-events-auto select-none">
                    <span className="material-symbols-outlined text-xs text-slate-500">
                      {activeRoute.mode === 'WALKING' ? 'directions_walk' : 'directions_car'}
                    </span>
                    <span className="font-bold">{activeRoute.altDuration}</span>
                    <span className="text-[10px] text-slate-500">({activeRoute.altDistance})</span>
                  </div>
                </OverlayViewF>
              )}

              {/* Primary Route Outer Casing */}
              <PolylineF
                path={activeRoute.coordinates}
                options={{
                  strokeColor: '#1557b0',
                  strokeOpacity: 0.35,
                  strokeWeight: 8,
                  zIndex: 15,
                }}
              />

              {/* Primary Route Core Line (Signature Google Blue) */}
              <PolylineF
                path={activeRoute.coordinates}
                options={{
                  strokeColor: '#1a73e8',
                  strokeOpacity: 0.98,
                  strokeWeight: 6,
                  zIndex: 16,
                }}
              />

              {/* Origin Marker (Google Maps Origin Circle) */}
              <OverlayViewF
                position={activeRoute.originCoord}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-10, -10)}
              >
                <div className="relative group cursor-pointer pointer-events-auto" title={`Origin: ${activeRoute.startAddress}`}>
                  <div className="w-5 h-5 rounded-full bg-white border-[3.5px] border-[#1a73e8] shadow-lg flex items-center justify-center ring-2 ring-black/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                  </div>
                </div>
              </OverlayViewF>

              {/* Destination Marker (Google Maps Red Pin) */}
              <OverlayViewF
                position={activeRoute.destCoord}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-16, -38)}
              >
                <div className="relative group cursor-pointer pointer-events-auto" title={`Destination: ${activeRoute.endAddress}`}>
                  <div className="relative flex flex-col items-center drop-shadow-xl animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-[#ea4335] text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-[#ea4335]/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-black/85" />
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[7px] border-t-[#ea4335] -mt-[1px]" />
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/85 text-white text-[10px] font-bold whitespace-nowrap shadow pointer-events-none z-30">
                    {activeRoute.endAddress}
                  </div>
                </div>
              </OverlayViewF>

              {/* Floating Route Duration & Distance Speech Bubble Badge */}
              <OverlayViewF
                position={activeRoute.midpoint}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-65, -55)}
              >
                <div className="relative group cursor-pointer pointer-events-auto select-none">
                  <div className="bg-white text-slate-900 px-3 py-1.5 rounded-xl shadow-xl border border-slate-200/90 flex items-center gap-2 hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[#1a73e8] text-base">
                      {activeRoute.mode === 'WALKING' ? 'directions_walk' : 'directions_car'}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="font-heading font-extrabold text-xs text-slate-900">
                        {activeRoute.duration}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {activeRoute.distance}
                      </span>
                    </div>
                  </div>
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white mx-auto -mt-[1px] drop-shadow-sm" />
                </div>
              </OverlayViewF>
            </>
          )}

          {/* Google Maps DirectionsRenderer fallback */}
          {!activeRoute && directionsResult && (
            <DirectionsRenderer
              directions={directionsResult}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#1a73e8',
                  strokeOpacity: 0.9,
                  strokeWeight: 6,
                },
              }}
            />
          )}

          {/* User Live GPS Marker (Google Maps Blue Dot & Accuracy Circle) */}
          {userGpsCoords && (
            <>
              <CircleF
                center={userGpsCoords}
                radius={gpsAccuracy ? Math.min(gpsAccuracy, 200) : 50}
                options={{
                  fillColor: '#4285f4',
                  fillOpacity: 0.15,
                  strokeColor: '#4285f4',
                  strokeOpacity: 0.4,
                  strokeWeight: 1,
                }}
              />
              <OverlayViewF
                position={userGpsCoords}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-12, -12)}
              >
                <div
                  className="relative group cursor-pointer pointer-events-auto"
                  title={`Your Live GPS Location (±${gpsAccuracy ? Math.round(gpsAccuracy) : 10}m)`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center ring-4 ring-blue-500/30">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-mono whitespace-nowrap shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    You are here
                  </div>
                </div>
              </OverlayViewF>
            </>
          )}

          {/* HAZARD & SHELTER PINS & TWO-TIER IMPACT RADII */}
          {layers.pins && (
            <>
              {/* ======================================================== */}
              {/* 1. REAL GROUND IMPACT RADII (RED / YELLOW / GREEN)       */}
              {/* ======================================================== */}

              {/* Joshimath Ground Failure Red Zone: 3,200m (Red) */}
              <CircleF
                center={{ lat: 30.556, lng: 79.563 }}
                radius={3200}
                options={{
                  fillColor: '#dc2626',
                  fillOpacity: 0.20,
                  strokeColor: '#dc2626',
                  strokeOpacity: 0.95,
                  strokeWeight: 2.5,
                  clickable: false,
                  zIndex: 2,
                }}
              />

              {/* Chamoli KM 214 Road Cut Red Zone: 2,400m (Red) */}
              <CircleF
                center={{ lat: 30.512, lng: 79.521 }}
                radius={2400}
                options={{
                  fillColor: '#dc2626',
                  fillOpacity: 0.20,
                  strokeColor: '#dc2626',
                  strokeOpacity: 0.95,
                  strokeWeight: 2.5,
                  clickable: false,
                  zIndex: 2,
                }}
              />

              {/* Sunil Ward Ground Creep Zone: 2,100m (Yellow) */}
              <CircleF
                center={{ lat: 30.56, lng: 79.57 }}
                radius={2100}
                options={{
                  fillColor: '#f59e0b',
                  fillOpacity: 0.18,
                  strokeColor: '#d97706',
                  strokeOpacity: 0.90,
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 2,
                }}
              />

              {/* Alaknanda / Pipalkoti Flash Flood Spillway Zone: 4,800m (Yellow) */}
              <CircleF
                center={{ lat: 30.429, lng: 79.33 }}
                radius={4800}
                options={{
                  fillColor: '#f59e0b',
                  fillOpacity: 0.18,
                  strokeColor: '#d97706',
                  strokeOpacity: 0.90,
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 2,
                }}
              />

              {/* Gauchar Safe Relocation Staging Hub: 5,000m (Green) */}
              <CircleF
                center={{ lat: 30.291, lng: 79.155 }}
                radius={5000}
                options={{
                  fillColor: '#22c55e',
                  fillOpacity: 0.15,
                  strokeColor: '#16a34a',
                  strokeOpacity: 0.85,
                  strokeWeight: 2,
                  clickable: false,
                  zIndex: 1,
                }}
              />

              {/* ======================================================== */}
              {/* 2. AI PREDICTED IMPACT RADII (PURPLE / BLUE / LIGHT-BLUE)*/}
              {/* RULE: If location has active Government Alert, bypass AI*/}
              {/* ======================================================== */}

              {/* Joshimath AI Model: Rendered ONLY if no active government directive exists */}
              {!checkLocationHasActiveGovOrder('joshimath', { lat: 30.556, lng: 79.563 }) && (
                <>
                  <CircleF
                    center={{ lat: 30.556, lng: 79.563 }}
                    radius={5200}
                    options={{
                      fillColor: '#9333ea',
                      fillOpacity: 0.12,
                      strokeColor: '#9333ea',
                      strokeOpacity: 0.85,
                      strokeWeight: 2,
                      clickable: false,
                      zIndex: 3,
                    }}
                  />
                  <CircleF
                    center={{ lat: 30.556, lng: 79.563 }}
                    radius={2200}
                    options={{
                      fillColor: '#9333ea',
                      fillOpacity: 0.22,
                      strokeColor: '#7e22ce',
                      strokeOpacity: 0.95,
                      strokeWeight: 2.5,
                      clickable: false,
                      zIndex: 4,
                    }}
                  />
                </>
              )}

              {/* Chamoli KM 214 AI Model: Rendered ONLY if no active government order exists */}
              {!checkLocationHasActiveGovOrder('chamoli', { lat: 30.512, lng: 79.521 }) && (
                <CircleF
                  center={{ lat: 30.512, lng: 79.521 }}
                  radius={4000}
                  options={{
                    fillColor: '#9333ea',
                    fillOpacity: 0.12,
                    strokeColor: '#9333ea',
                    strokeOpacity: 0.85,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 3,
                  }}
                />
              )}

              {/* Sunil Ward AI Model: Rendered ONLY if no active government order exists */}
              {!checkLocationHasActiveGovOrder('sunil', { lat: 30.56, lng: 79.57 }) && (
                <CircleF
                  center={{ lat: 30.56, lng: 79.57 }}
                  radius={3800}
                  options={{
                    fillColor: '#2563eb',
                    fillOpacity: 0.13,
                    strokeColor: '#2563eb',
                    strokeOpacity: 0.85,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 3,
                  }}
                />
              )}

              {/* Alaknanda / Pipalkoti AI Surge Forecast: Rendered ONLY if no active government order exists */}
              {!checkLocationHasActiveGovOrder('pipalkoti', { lat: 30.429, lng: 79.33 }) && (
                <CircleF
                  center={{ lat: 30.429, lng: 79.33 }}
                  radius={8500}
                  options={{
                    fillColor: '#2563eb',
                    fillOpacity: 0.13,
                    strokeColor: '#2563eb',
                    strokeOpacity: 0.85,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 3,
                  }}
                />
              )}

              {/* Gauchar Tableland Safe Buffer AI Model: Rendered ONLY if no active government order exists */}
              {!checkLocationHasActiveGovOrder('gauchar', { lat: 30.291, lng: 79.155 }) && (
                <CircleF
                  center={{ lat: 30.291, lng: 79.155 }}
                  radius={12000}
                  options={{
                    fillColor: '#38bdf8',
                    fillOpacity: 0.08,
                    strokeColor: '#0ea5e9',
                    strokeOpacity: 0.70,
                    strokeWeight: 1.5,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
              )}

              {/* Active Enforced Government Directive Rings (Solid Red / Amber Official Mandates) */}
              {activeDirectives.map((dir: any) => {
                if (!dir.coordinates) return null;
                return (
                  <CircleF
                    key={`active-gov-directive-${dir.id || dir.order_code}`}
                    center={dir.coordinates}
                    radius={dir.threatRadiusMeters || 3200}
                    options={{
                      fillColor: '#dc2626',
                      fillOpacity: 0.22,
                      strokeColor: '#b91c1c',
                      strokeOpacity: 0.98,
                      strokeWeight: 3.2,
                      clickable: false,
                      zIndex: 6,
                    }}
                  />
                );
              })}

              {/* MARKER 1: JOSHIMATH SUBSIDENCE HAZARD PIN */}
              <OverlayViewF
                position={{ lat: 30.556, lng: 79.563 }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-72, -72)}
              >
                <div
                  className="cursor-pointer group relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity('joshimath');
                  }}
                >
                  <div className="relative w-36 h-36 flex items-center justify-center pointer-events-auto">
                    <div className="absolute inset-0 rounded-full bg-error/15 border-2 border-dashed border-error/50 pulsing-threat pointer-events-none"></div>
                    <div className="w-16 h-16 rounded-full bg-error/25 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span
                          className="material-symbols-outlined text-lg text-white"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          landslide
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-6 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-md border border-outline-variant flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                      RED ZONE • Joshimath ({josHab?.riskScore ?? 74.8}/100)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 2: SUNIL WARD UPPER TERRACE HAZARD PIN */}
              <OverlayViewF
                position={{ lat: 30.560, lng: 79.570 }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-50, -50)}
              >
                <div
                  className="cursor-pointer group relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity('sunil_ward');
                  }}
                >
                  <div className="relative w-24 h-24 flex items-center justify-center pointer-events-auto">
                    <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-base text-white"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        warning
                      </span>
                    </div>
                    <div className="absolute -bottom-5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      RED ZONE • Sunil Ward ({sunilHab?.riskScore ?? 69.7}/100)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 3: ALAKNANDA FLASH FLOOD SURGE PIN */}
              <OverlayViewF
                position={{ lat: 30.429, lng: 79.330 }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-56, -56)}
              >
                <div
                  className="cursor-pointer group relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity('alaknanda');
                  }}
                >
                  <div className="relative w-28 h-28 flex items-center justify-center pointer-events-auto">
                    <div className="absolute inset-0 rounded-full bg-amber-500/15 border border-amber-500/40 animate-pulse pointer-events-none"></div>
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-base text-white"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        flood
                      </span>
                    </div>
                    <div className="absolute -bottom-5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      YELLOW ZONE • Pipalkoti ({pipalHab?.riskScore ?? 39.2}/100)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 4: CHAMOLI NH-58 SLIP PIN */}
              <OverlayViewF
                position={{ lat: 30.512, lng: 79.521 }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-48, -48)}
              >
                <div
                  className="cursor-pointer group relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity('chamoli');
                  }}
                >
                  <div className="relative w-24 h-24 flex items-center justify-center pointer-events-auto">
                    <div className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        minor_crash
                      </span>
                    </div>
                    <div className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      RED ZONE • KM 214 Road Cut ({chamHab?.riskScore ?? 74.8}/100)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 5: SAFE SHELTER GAUCHAR AIRSTRIP HUB PIN */}
              <OverlayViewF
                position={{ lat: 30.291, lng: 79.155 }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getOffset(-70, -35)}
              >
                <div
                  className="cursor-pointer group relative pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntity('shelter_gauchar');
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#2e7d32] text-white flex items-center justify-center shadow-lg ring-4 ring-[#2e7d32]/20 group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        night_shelter
                      </span>
                    </div>
                    <div className="mt-1 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-[#1b5e20] text-[11px] font-bold shadow-md border border-[#2e7d32]/40 flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-[#2e7d32]"></span>
                      GREEN ZONE (SAFE) • Gauchar Hub ({gauchHab?.riskScore ?? 18.0}/100)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* LIVE DISASTERS & MULTI-TIER CONCENTRIC HEATMAP RINGS */}
              {layers.pins &&
                liveDisasters?.map((d) => (
                  <React.Fragment key={`live-gmap-${d.id}`}>
                    {d.concentricRings?.map((ring) => (
                      <CircleF
                        key={`ring-${d.id}-${ring.tier}`}
                        center={d.coordinates}
                        radius={ring.radius}
                        options={{
                          fillColor: ring.fillColor,
                          fillOpacity: ring.fillOpacity,
                          strokeColor: ring.strokeColor,
                          strokeOpacity: ring.strokeOpacity,
                          strokeWeight: ring.strokeWeight,
                          clickable: false,
                          zIndex: 10 - ring.tier,
                        }}
                      />
                    ))}
                    <OverlayViewF
                      position={d.coordinates}
                      mapPaneName={OVERLAY_MOUSE_TARGET}
                      getPixelPositionOffset={getOffset(-24, -24)}
                    >
                      <div
                        className="cursor-pointer group relative pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity(d.id);
                        }}
                        title={`${d.title} (${d.category})`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-125 border-2 border-white"
                            style={{ backgroundColor: d.concentricRings[0]?.fillColor || '#D32F2F' }}
                          >
                            <span className="material-symbols-outlined text-base">
                              {getDisasterCategoryIcon(d.category)}
                            </span>
                          </div>
                          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-ping"
                              style={{ backgroundColor: d.concentricRings[0]?.fillColor || '#D32F2F' }}
                            />
                            <span>{d.title}</span>
                          </div>
                        </div>
                      </div>
                    </OverlayViewF>
                  </React.Fragment>
                ))}
            </>
          )}
        </GoogleMap>
      ) : (
        /* 2. Tactical Fallback Map with Notice when API Key is pending */
        <div
          className={`w-full h-full relative flex items-center justify-center ${
            mapTypeId === 'satellite' || mapTypeId === 'hybrid'
              ? 'bg-[#0f172a]'
              : mapTypeId === 'roadmap'
              ? 'bg-[#f1f5f9]'
              : 'gis-grid'
          }`}
          onClick={onCanvasClick}
        >
          {/* Topographic & Hydrographic Overlay Vectors */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="w-full h-full opacity-65"
              preserveAspectRatio="none"
              viewBox="0 0 1200 800"
            >
              <path
                d="M 0 150 Q 300 120 600 240 T 1200 210"
                fill="none"
                stroke={mapTypeId === 'satellite' ? '#475569' : '#cac4d2'}
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <path
                d="M 0 320 Q 380 280 750 420 T 1200 360"
                fill="none"
                stroke={mapTypeId === 'satellite' ? '#475569' : '#cac4d2'}
                strokeWidth="2"
              />
              <path
                d="M 0 520 Q 420 460 850 620 T 1200 580"
                fill="none"
                stroke={mapTypeId === 'satellite' ? '#475569' : '#cac4d2'}
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            </svg>
            {/* Real Highway Route in Fallback Map Canvas */}
            {activeRoute && activeRoute.coordinates.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <polyline
                  points={activeRoute.coordinates.map(pt => {
                    const x = ((pt.lng - 77.2) / 3.8) * 1200;
                    const y = ((32.2 - pt.lat) / 3.2) * 800;
                    return `${Math.max(0, Math.min(1200, Math.round(x)))},${Math.max(0, Math.min(800, Math.round(y)))}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#1a73e8"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Fallback View Mode Badge */}
          <div className="absolute top-28 left-6 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant shadow-md text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>View: {mapTypeId.toUpperCase()} MODE</span>
          </div>

          {/* HAZARD & SHELTER PINS & TWO-TIER IMPACT RADII IN FALLBACK */}
          {layers.pins && (
            <>
              {/* HAZARD PIN 1: JOSHIMATH SUBSIDENCE (REAL: RED | AI: PURPLE) */}
              <div
                className="absolute top-[46%] left-[46%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('joshimath');
                }}
              >
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* AI Predicted Forewarning Impact Radius (70-100: Purple Dashed) */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-600/70 bg-purple-600/10 animate-pulse pointer-events-none" />
                  {/* Real Ground Failure Impact Radius (Red Solid) */}
                  <div className="absolute w-24 h-24 rounded-full border-2 border-red-600/80 bg-red-600/20 pulsing-threat pointer-events-none" />

                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative z-10 ring-2 ring-purple-600">
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      landslide
                    </span>
                  </div>
                  <div className="absolute -bottom-6 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1.5 whitespace-nowrap z-20">
                    <span className="w-2 h-2 rounded-full bg-red-600" title="Real: Red Zone" />
                    <span>RED (Real 3.2km)</span>
                    <span className="text-purple-600 font-mono">• AI 82.4</span>
                  </div>
                </div>
              </div>

              {/* HAZARD PIN 2: SUNIL WARD UPPER TERRACE (REAL: YELLOW | AI: BLUE) */}
              <div
                className="absolute top-[42%] left-[49%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('sunil_ward');
                }}
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* AI Predicted Creep Impact Radius (40-69.9: Blue Dashed) */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-600/70 bg-blue-600/10 pointer-events-none" />
                  {/* Real Ground Slip Impact Radius (Yellow Solid) */}
                  <div className="absolute w-20 h-20 rounded-full border-2 border-amber-500/80 bg-amber-500/20 pointer-events-none" />

                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg ring-2 ring-blue-600 group-hover:scale-110 transition-transform relative z-10">
                    <span className="material-symbols-outlined text-base">warning</span>
                  </div>
                  <div className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant whitespace-nowrap z-20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>YELLOW (Real)</span>
                    <span className="text-blue-600 font-mono">• AI 58.6</span>
                  </div>
                </div>
              </div>

              {/* HAZARD PIN 3: CHAMOLI NH-58 SLIP (REAL: RED | AI: PURPLE) */}
              <div
                className="absolute top-[52%] left-[55%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('chamoli');
                }}
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* AI Predicted Wedge Impact Radius (70-100: Purple Dashed) */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-600/70 bg-purple-600/10 pointer-events-none" />
                  {/* Real Road Cut Impact Radius (Red Solid) */}
                  <div className="absolute w-22 h-22 rounded-full border-2 border-red-600/80 bg-red-600/20 pointer-events-none" />

                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg ring-2 ring-purple-600 group-hover:scale-110 transition-transform relative z-10">
                    <span className="material-symbols-outlined text-base">minor_crash</span>
                  </div>
                  <div className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant whitespace-nowrap z-20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>RED (Real)</span>
                    <span className="text-purple-600 font-mono">• AI 76.5</span>
                  </div>
                </div>
              </div>

              {/* HAZARD PIN 4: ALAKNANDA SURGE (REAL: YELLOW | AI: BLUE) */}
              <div
                className="absolute top-[58%] left-[62%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('alaknanda');
                }}
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* AI Predicted Surge Inundation Radius (40-69.9: Blue Dashed) */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-600/70 bg-blue-600/10 pointer-events-none" />
                  {/* Real Spillway Overbank Impact Radius (Yellow Solid) */}
                  <div className="absolute w-24 h-24 rounded-full border-2 border-amber-500/80 bg-amber-500/20 animate-pulse pointer-events-none" />

                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg ring-2 ring-blue-600 group-hover:scale-110 transition-transform relative z-10">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      flood
                    </span>
                  </div>
                  <div className="absolute -bottom-5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap z-20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>YELLOW (Real)</span>
                    <span className="text-blue-600 font-mono">• AI 46.8</span>
                  </div>
                </div>
              </div>

              {/* FALLBACK LIVE GPS BLUE DOT */}
              {userGpsCoords && (
                <div
                  className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group"
                  title="Your Live GPS Position"
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 animate-ping absolute inset-0"></div>
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    </div>
                    <div className="mt-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-blue-700 text-[10px] font-bold shadow border border-blue-300 whitespace-nowrap">
                      You are here (Live GPS)
                    </div>
                  </div>
                </div>
              )}

              {/* SAFE SHELTER PIN 1: GAUCHAR FIELD HUB (GREEN ZONE) */}
              <div
                className="absolute top-[66%] left-[74%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('shelter_gauchar');
                }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-[#2e7d32] text-white flex items-center justify-center shadow-lg ring-4 ring-[#2e7d32]/20 group-hover:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      night_shelter
                    </span>
                  </div>
                  <div className="mt-1 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-[#1b5e20] text-[11px] font-bold shadow-md border border-[#2e7d32]/40 flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#2e7d32]"></span>
                    GREEN ZONE (SAFE) • Gauchar Hub ({gauchHab?.riskScore ?? 18.0}/100)
                  </div>
                </div>
              </div>

              {/* LIVE DISASTERS CONCENTRIC HEATMAPS ON FALLBACK SVG */}
              {layers.pins &&
                liveDisasters?.map((d) => {
                  const pos = coordsToSvgPercent(d.coordinates.lat, d.coordinates.lng);
                  return (
                    <div
                      key={`svg-live-${d.id}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                      style={{ top: pos.top, left: pos.left }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntity(d.id);
                      }}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-36 h-36 rounded-full border border-sky-400/30 bg-sky-400/10 pointer-events-none animate-pulse" />
                        <div className="absolute w-24 h-24 rounded-full border border-amber-400/40 bg-amber-400/15 pointer-events-none" />
                        <div className="absolute w-16 h-16 rounded-full border border-orange-500/50 bg-orange-500/25 pointer-events-none" />
                        <div
                          className="w-8 h-8 rounded-full text-white shadow-xl flex items-center justify-center border-2 border-white relative z-10 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: d.concentricRings[0]?.fillColor || '#D32F2F' }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {getDisasterCategoryIcon(d.category)}
                          </span>
                        </div>
                        <div className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow border border-outline-variant whitespace-nowrap z-20">
                          {d.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* 3. Google Maps API Key Setup Banner (Top Center) */}
      {!hasKey && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100vw-2rem)] pointer-events-auto">
          <div className="p-3 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-xl">map</span>
              <div>
                <span className="font-bold">Google Maps API:</span> Add key to{' '}
                <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[11px]">
                  Frontend/.env
                </code>
              </div>
            </div>
            <button
              className="px-3 py-1 rounded-full bg-primary text-on-primary font-bold text-[11px] shadow-sm hover:bg-primary-container transition-colors shrink-0"
              onClick={() => setShowKeyModal(true)}
              type="button"
            >
              Enter Key
            </button>
          </div>
        </div>
      )}

      {/* Mode 1 & 2: HUD Legend (Moved to Bottom-Right with Minimize/Maximize Toggle) */}
      {isLegendMinimized ? (
        <button
          onClick={() => setIsLegendMinimized(false)}
          type="button"
          className="absolute bottom-6 right-20 sm:right-24 md:right-24 z-30 pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-xl hover:bg-surface-container text-on-surface text-xs font-bold transition-all group animate-fadeIn"
          title="Maximize Legend"
        >
          <span className="material-symbols-outlined text-primary text-base">radar</span>
          <span>Map Legend</span>
          <span className="material-symbols-outlined text-xs text-outline group-hover:text-on-surface transition-colors">
            open_in_full
          </span>
        </button>
      ) : (
        <>
          {/* Mode 1: Dual Impact Radii HUD Legend (Real vs AI Predicted) */}
          {currentMode === 1 && (
            <div className="absolute bottom-6 right-20 sm:right-24 md:right-24 z-30 pointer-events-auto p-3.5 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-xl max-w-xs text-xs space-y-2.5 font-sans select-none animate-fadeIn">
              <div className="flex items-center justify-between font-bold border-b border-outline-variant/60 pb-2">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-sm text-primary">radar</span>
                  Dual Impact Radii Legend
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-mono">
                    Live HUD
                  </span>
                  <button
                    onClick={() => setIsLegendMinimized(true)}
                    type="button"
                    className="p-0.5 rounded-md hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
                    title="Minimize Legend"
                  >
                    <span className="material-symbols-outlined text-sm">unfold_less</span>
                  </button>
                </div>
              </div>

              {/* 1. Real Ground Impact Radius (Red, Yellow, Green) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-on-surface">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-red-500/40" />
                    1. Real Ground Impact Radius
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Observed</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                  <div className="p-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300">
                    <span className="block text-[9px] opacity-75">HIGH RISK</span>
                    <span>🔴 Red Zone</span>
                  </div>
                  <div className="p-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">
                    <span className="block text-[9px] opacity-75">MODERATE</span>
                    <span>🟡 Yellow</span>
                  </div>
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300">
                    <span className="block text-[9px] opacity-75">SAFE HUB</span>
                    <span>🟢 Green</span>
                  </div>
                </div>
              </div>

              {/* 2. AI Predicted Impact Radius (Purple, Blue, Light-Blue) */}
              <div className="space-y-1 pt-1.5 border-t border-outline-variant/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-on-surface">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-purple-600 bg-purple-500/40" />
                    2. AI Predicted Impact Radius
                  </span>
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">Forewarning</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                  <div className="p-1 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300">
                    <span className="block text-[9px] opacity-75">70 - 100</span>
                    <span>🟣 Purple</span>
                  </div>
                  <div className="p-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300">
                    <span className="block text-[9px] opacity-75">40 - 69.9</span>
                    <span>🔵 Blue</span>
                  </div>
                  <div className="p-1 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-300">
                    <span className="block text-[9px] opacity-75">0 - 39.9</span>
                    <span>💧 Light-Blue</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Dynamic Risk Zoning & Relocation Score HUD Legend */}
          {currentMode === 2 && (
            <div className="absolute bottom-6 right-20 sm:right-24 md:right-24 z-30 pointer-events-auto p-3.5 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-xl max-w-xs text-xs space-y-2 font-sans select-none animate-fadeIn">
              <div className="flex items-center justify-between font-bold border-b border-outline-variant/60 pb-2">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-sm text-primary">shield</span>
                  Dynamic Risk Zoning
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-mono">
                    0-100 Score
                  </span>
                  <button
                    onClick={() => setIsLegendMinimized(true)}
                    type="button"
                    className="p-0.5 rounded-md hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
                    title="Minimize Legend"
                  >
                    <span className="material-symbols-outlined text-sm">unfold_less</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-error/10 border border-error/25">
                  <span className="flex items-center gap-1.5 font-bold text-error">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                    RED ZONE (70-100)
                  </span>
                  <span className="text-[10px] text-error font-medium">Immediate Relocation</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                  <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    YELLOW ZONE (40-69)
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Prepare & Monitor</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#2e7d32]/10 border border-[#2e7d32]/25">
                  <span className="flex items-center gap-1.5 font-bold text-[#2e7d32] dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-[#2e7d32]" />
                    GREEN ZONE (0-39)
                  </span>
                  <span className="text-[10px] text-[#2e7d32] dark:text-emerald-400 font-medium">Normal Monitoring</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. Quick API Key Input Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-outline-variant p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">key</span>
                <h3 className="font-heading font-bold text-sm text-on-surface">
                  Google Maps API Configuration
                </h3>
              </div>
              <button
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                onClick={() => setShowKeyModal(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Paste your Google Maps JavaScript API key below to render live satellite terrain and road tiles. Alternatively, you can add it to{' '}
              <code className="font-mono bg-surface-container px-1 rounded">
                Frontend/.env
              </code>{' '}
              as <code className="font-mono font-bold">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  Google Maps API Key
                </label>
                <input
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                  placeholder="AIzaSy..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 rounded-full border border-outline text-xs font-bold"
                  onClick={() => setShowKeyModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold shadow-sm hover:bg-primary-container transition-colors"
                  type="submit"
                >
                  Activate Google Maps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
