import React from 'react';

export type GoogleMapType = 'terrain' | 'satellite' | 'hybrid' | 'roadmap';

export interface MapLayerSettings {
  river: boolean;
  highway: boolean;
  evacRoute: boolean;
  pins: boolean;
}

interface MapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMapType: GoogleMapType;
  onSelectMapType: (type: GoogleMapType) => void;
  layers: MapLayerSettings;
  onToggleLayer: (layer: keyof MapLayerSettings) => void;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  isOpen,
  onClose,
  currentMapType,
  onSelectMapType,
  layers,
  onToggleLayer,
}) => {
  if (!isOpen) return null;

  const mapTypes: {
    id: GoogleMapType;
    label: string;
    desc: string;
    icon: string;
    color: string;
  }[] = [
    {
      id: 'terrain',
      label: 'Terrain View',
      desc: 'Topographic contour elevation, hillshade relief & slope angles (Recommended for Disaster HUD)',
      icon: 'terrain',
      color: 'text-amber-700 bg-amber-100',
    },
    {
      id: 'satellite',
      label: 'Satellite View',
      desc: 'Pure high-resolution aerial and satellite photographic imagery without road overlays',
      icon: 'satellite_alt',
      color: 'text-blue-700 bg-blue-100',
    },
    {
      id: 'hybrid',
      label: 'Hybrid View',
      desc: 'Photorealistic satellite imagery combined with detailed roads, town borders & corridor labels',
      icon: 'layers',
      color: 'text-purple-700 bg-purple-100',
    },
    {
      id: 'roadmap',
      label: 'Roadmap View',
      desc: 'Clean vector highway & road network map for logistics transit and clear navigation',
      icon: 'map',
      color: 'text-emerald-700 bg-emerald-100',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">tune</span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-on-surface">
                Map View &amp; Display Settings
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Switch Google Map base modes and toggle geospatial layers
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* 1. Map View Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-heading font-bold text-on-surface uppercase tracking-wider block">
            Select Map View Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mapTypes.map((item) => {
              const isSelected = currentMapType === item.id;
              return (
                <button
                  key={item.id}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-98 ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/20 shadow-md ring-2 ring-primary/20'
                      : 'border-outline-variant hover:bg-surface-container-low hover:border-outline'
                  }`}
                  onClick={() => onSelectMapType(item.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}
                    >
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xs text-on-surface">{item.label}</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tactical Overlay Layers Toggles */}
        <div className="space-y-2 pt-2 border-t border-outline-variant">
          <label className="text-xs font-heading font-bold text-on-surface uppercase tracking-wider block">
            Tactical Overlays
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:bg-surface-container">
              <input
                type="checkbox"
                checked={layers.river}
                onChange={() => onToggleLayer('river')}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-semibold text-on-surface">Alaknanda River Corridor</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:bg-surface-container">
              <input
                type="checkbox"
                checked={layers.highway}
                onChange={() => onToggleLayer('highway')}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-semibold text-on-surface">Severed NH-58 Highway</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:bg-surface-container">
              <input
                type="checkbox"
                checked={layers.evacRoute}
                onChange={() => onToggleLayer('evacRoute')}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-semibold text-on-surface">Safe Evacuation Route</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:bg-surface-container">
              <input
                type="checkbox"
                checked={layers.pins}
                onChange={() => onToggleLayer('pins')}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span className="font-semibold text-on-surface">Hazard &amp; Shelter Pins</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold shadow-sm hover:bg-primary-container transition-all active:scale-95"
            onClick={onClose}
            type="button"
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSettingsModal;
