import React from 'react';

interface RadarHudCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RadarHudCard: React.FC<RadarHudCardProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed top-20 right-4 z-40 w-80 rounded-3xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-2xl p-4 transition-all"
      id="radar-hud-card"
    >
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60 text-xs font-bold">
        <span className="flex items-center gap-1.5 text-on-surface">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          DOPPLER SATELLITE RADAR
        </span>
        <button
          className="text-outline hover:text-on-surface"
          onClick={onClose}
          type="button"
          title="Close Radar"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="relative w-full h-36 rounded-2xl overflow-hidden my-2.5 bg-[#141d26] border border-outline-variant flex items-center justify-center">
        {/* Animated Doppler Grid */}
        <div className="absolute w-28 h-28 rounded-full border border-outline-variant/30"></div>
        <div className="absolute w-16 h-16 rounded-full border border-outline-variant/40"></div>
        <div className="absolute top-6 left-10 w-16 h-12 bg-error/70 rounded-full blur-md animate-pulse"></div>

        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-between text-white text-[10px] font-mono">
          <span>Severe Cell #09</span>
          <span className="text-amber-300 font-bold">114 mm/h</span>
        </div>
      </div>

      <div className="text-[11px] text-on-surface-variant flex justify-between px-1">
        <span>Sweep: 42s ago</span>
        <span className="text-[#2e7d32] font-semibold">INSAT-3DR Link Active</span>
      </div>
    </div>
  );
};

export default RadarHudCard;
