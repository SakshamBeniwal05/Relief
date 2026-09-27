import React from 'react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRecenterGPS?: () => void;
  onOpenMapSettings?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenterGPS,
  onOpenMapSettings,
}) => {
  return (
    <div className="flex flex-col bg-surface-container-lowest/90 backdrop-blur-md rounded-full border border-outline-variant shadow-lg p-1 gap-1 text-on-surface">
      {onOpenMapSettings && (
        <>
          <button
            className="p-2 rounded-full hover:bg-surface-container-high active:scale-90 transition-all text-primary"
            onClick={onOpenMapSettings}
            title="Switch Map Views (Satellite, Terrain, Hybrid, Roadmap)"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">layers</span>
          </button>
          <div className="w-full h-px bg-outline-variant"></div>
        </>
      )}
      <button
        className="p-2 rounded-full hover:bg-surface-container-high active:scale-90 transition-all text-primary"
        onClick={onRecenterGPS || (() => alert('GPS locked: Kedarnath-Alaknanda Basin'))}
        title="Recenter GPS"
        type="button"
      >
        <span className="material-symbols-outlined text-lg">my_location</span>
      </button>
      <div className="w-full h-px bg-outline-variant"></div>
      <button
        className="p-2 rounded-full hover:bg-surface-container-high active:scale-90 transition-all"
        onClick={onZoomIn || (() => alert('Zoomed in'))}
        title="Zoom In"
        type="button"
      >
        <span className="material-symbols-outlined text-lg">add</span>
      </button>
      <button
        className="p-2 rounded-full hover:bg-surface-container-high active:scale-90 transition-all"
        onClick={onZoomOut || (() => alert('Zoomed out'))}
        title="Zoom Out"
        type="button"
      >
        <span className="material-symbols-outlined text-lg">remove</span>
      </button>
    </div>
  );
};

export default MapControls;
