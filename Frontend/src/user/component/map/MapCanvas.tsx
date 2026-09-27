import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  PolylineF,
  OVERLAY_MOUSE_TARGET,
} from '@react-google-maps/api';
import type { HazardEntity, ModeType } from '../../types';
import type { GoogleMapType, MapLayerSettings } from './MapSettingsModal';

interface MapCanvasProps {
  currentMode: ModeType;
  mapTypeId?: GoogleMapType;
  layers?: MapLayerSettings;
  entities?: { key: string; entity: HazardEntity }[];
  onSelectEntity: (key: string) => void;
  onCanvasClick?: () => void;
  onMapLoad?: (map: google.maps.Map) => void;
  targetCoordinates?: { lat: number; lng: number } | null;
}

// Center coordinate for Kedarnath - Alaknanda Valley Basin
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 30.45, lng: 79.36 };

// Polyline Paths
const ALAKNANDA_RIVER_PATH: google.maps.LatLngLiteral[] = [
  { lat: 30.74, lng: 79.49 }, // Badrinath
  { lat: 30.56, lng: 79.56 }, // Joshimath
  { lat: 30.51, lng: 79.52 }, // Helang
  { lat: 30.43, lng: 79.33 }, // Pipalkoti
  { lat: 30.38, lng: 79.28 }, // Chamoli
  { lat: 30.29, lng: 79.16 }, // Gauchar
];

const NH58_HIGHWAY_PATH: google.maps.LatLngLiteral[] = [
  { lat: 30.58, lng: 79.57 },
  { lat: 30.556, lng: 79.563 },
  { lat: 30.512, lng: 79.521 }, // Slip Point KM 214
  { lat: 30.429, lng: 79.330 },
  { lat: 30.291, lng: 79.155 },
];

const SAFE_EVAC_ROUTE_PATH: google.maps.LatLngLiteral[] = [
  { lat: 30.556, lng: 79.563 }, // Joshimath Red Zone
  { lat: 30.53, lng: 79.45 },  // Helang High Ridge Bypass
  { lat: 30.38, lng: 79.22 },  // Safe Corridor
  { lat: 30.291, lng: 79.155 }, // Gauchar Staging Center
];

// Required libraries for Google Maps
const MAP_LIBRARIES: ('places' | 'geometry')[] = ['geometry'];

export const MapCanvas: React.FC<MapCanvasProps> = ({
  currentMode,
  mapTypeId = 'terrain',
  layers = { river: true, highway: true, evacRoute: true, pins: true },
  entities = [],
  onSelectEntity,
  onCanvasClick,
  onMapLoad,
  targetCoordinates,
}) => {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [apiKey, setApiKey] = useState<string>(() => {
    return envKey.trim() || localStorage.getItem('gmaps_api_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const mapRef = useRef<google.maps.Map | null>(null);

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
          {/* Alaknanda River Corridor Polyline */}
          {layers.river && (
            <PolylineF
              path={ALAKNANDA_RIVER_PATH}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.85,
                strokeWeight: 5,
              }}
            />
          )}

          {/* Severed NH-58 Highway Polyline (Red Dashed) */}
          {layers.highway && (
            <PolylineF
              path={NH58_HIGHWAY_PATH}
              options={{
                strokeColor: '#ba1a1a',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                icons: [
                  {
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 3,
                    },
                    offset: '0',
                    repeat: '15px',
                  },
                ],
              }}
            />
          )}

          {/* Safe Relocation Route (Mode 2: Green Dashed) */}
          {layers.evacRoute && currentMode === 2 && (
            <PolylineF
              path={SAFE_EVAC_ROUTE_PATH}
              options={{
                strokeColor: '#2e7d32',
                strokeOpacity: 0.9,
                strokeWeight: 5,
                icons: [
                  {
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 4,
                    },
                    offset: '0',
                    repeat: '20px',
                  },
                ],
              }}
            />
          )}

          {/* HAZARD & SHELTER PINS */}
          {layers.pins && (
            <>
              {entities.map(({ key, entity }) => entity.coordinates && (
                <OverlayViewF
                  key={key}
                  position={entity.coordinates}
                  mapPaneName={OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={getOffset(-36, -36)}
                >
                  <button
                    aria-label={`Open ${entity.title}`}
                    className={`group flex flex-col items-center text-left ${entity.category.startsWith('SAFE TERMINAL') ? 'text-[#2e7d32]' : 'text-error'}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectEntity(key);
                    }}
                    type="button"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-4 transition-transform group-hover:scale-110 ${entity.category.startsWith('SAFE TERMINAL') ? 'bg-[#2e7d32] ring-[#2e7d32]/20' : 'bg-error ring-error/20'}`}>
                      <span className="material-symbols-outlined text-lg">{entity.category.startsWith('SAFE TERMINAL') ? 'night_shelter' : 'warning'}</span>
                    </span>
                    <span className="mt-1 max-w-48 truncate rounded-full border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-[10px] font-bold text-on-surface shadow-md">{entity.title}</span>
                  </button>
                </OverlayViewF>
              ))}
              {entities.length === 0 && <>
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
                      Joshimath Sector (FoS: 0.84)
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 2: ALAKNANDA FLASH FLOOD SURGE PIN */}
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
                    <div className="absolute inset-0 rounded-full bg-error/15 border border-error/40 animate-pulse pointer-events-none"></div>
                    <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-base text-white"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        flood
                      </span>
                    </div>
                    <div className="absolute -bottom-5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      Pipalkoti Surge
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 3: CHAMOLI NH-58 SLIP PIN */}
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
                    <div className="w-8 h-8 rounded-full bg-tertiary-container text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        minor_crash
                      </span>
                    </div>
                    <div className="absolute -bottom-5 px-2 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[10px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      KM 214 Road Cut
                    </div>
                  </div>
                </div>
              </OverlayViewF>

              {/* MARKER 4: SAFE SHELTER GAUCHAR AIRSTRIP HUB PIN */}
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
                      Gauchar Hub (58 Beds Free)
                    </div>
                  </div>
                </div>
              </OverlayViewF>
              </>}
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
              {/* Alaknanda River */}
              {layers.river && (
                <path
                  d="M 120 40 Q 280 200 460 310 T 780 490 T 1150 780"
                  fill="none"
                  opacity="0.8"
                  stroke="#3b82f6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="6"
                />
              )}
              {/* Severed NH-58 Highway (Red Dashed) */}
              {layers.highway && (
                <path
                  d="M 220 80 L 450 300 L 590 410 L 760 510 L 1020 720"
                  fill="none"
                  opacity="0.75"
                  stroke="#ba1a1a"
                  strokeDasharray="8 6"
                  strokeWidth="4"
                />
              )}
              {/* Mode 2 Safe Relocation Route (Green Dashed) */}
              {layers.evacRoute && (
                <path
                  className={currentMode === 2 ? '' : 'hidden'}
                  d="M 450 300 Q 560 260 670 330 T 890 530"
                  fill="none"
                  stroke="#2e7d32"
                  strokeDasharray="10 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="6"
                />
              )}
            </svg>
            <span className="absolute top-[12%] left-[34%] text-[11px] font-bold font-heading text-outline uppercase tracking-wider">
              Kedarnath Ridge (Elev 3,583m)
            </span>
            <span className="absolute top-[37%] left-[46%] text-[11px] font-bold font-heading text-[#3960b0] uppercase tracking-wider">
              Alaknanda River Corridor
            </span>
            <span className="absolute bottom-[23%] right-[22%] text-[11px] font-bold font-heading text-outline uppercase tracking-wider">
              NH-58 Bypass Corridor
            </span>
          </div>

          {/* Fallback View Mode Badge */}
          <div className="absolute top-28 left-6 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant shadow-md text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>View: {mapTypeId.toUpperCase()} MODE</span>
          </div>

          {/* HAZARD & SHELTER PINS IN FALLBACK */}
          {layers.pins && (
            <>
              {entities.map(({ key, entity }) => entity.coordinates && (
                <button
                  key={key}
                  aria-label={`Open ${entity.title}`}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    top: `${Math.max(12, Math.min(86, 20 + (30.74 - entity.coordinates.lat) * 100))}%`,
                    left: `${Math.max(12, Math.min(86, 80 - (entity.coordinates.lng - 79.15) * 120))}%`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectEntity(key);
                  }}
                  type="button"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ring-4 transition-transform group-hover:scale-110 ${entity.category.startsWith('SAFE TERMINAL') ? 'bg-[#2e7d32] ring-[#2e7d32]/20' : 'bg-error ring-error/20'}`}>
                    <span className="material-symbols-outlined text-lg">{entity.category.startsWith('SAFE TERMINAL') ? 'night_shelter' : 'warning'}</span>
                  </span>
                  <span className="mt-1 block max-w-48 truncate rounded-full border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-[10px] font-bold text-on-surface shadow-md">{entity.title}</span>
                </button>
              ))}
              {entities.length === 0 && <>
              {/* HAZARD PIN 1: JOSHIMATH SUBSIDENCE */}
              <div
                className="absolute top-[46%] left-[46%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('joshimath');
                }}
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-error/15 border-2 border-dashed border-error/50 pulsing-threat"></div>
                  <div className="w-16 h-16 rounded-full bg-error/25 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        landslide
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 px-3 py-1 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-md border border-outline-variant flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-error"></span> Joshimath Sector (FoS: 0.84)
                  </div>
                </div>
              </div>

              {/* HAZARD PIN 2: ALAKNANDA SURGE */}
              <div
                className="absolute top-[58%] left-[62%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity('alaknanda');
                }}
              >
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-error/15 border border-error/40 animate-pulse"></div>
                  <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      flood
                    </span>
                  </div>
                  <div className="absolute -bottom-5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface text-[11px] font-bold shadow-md border border-outline-variant flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Pipalkoti Surge
                  </div>
                </div>
              </div>

              {/* SAFE SHELTER PIN 1: GAUCHAR FIELD HUB */}
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
                    <span className="w-2 h-2 rounded-full bg-[#2e7d32]"></span> Gauchar Hub (58 Beds Free)
                  </div>
                </div>
              </div>
              </>}
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
