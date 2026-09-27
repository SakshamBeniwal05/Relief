import React from 'react';
import type { ModeType } from '../../types';

interface UserNavbarProps {
  currentMode: ModeType;
  onSelectMode: (mode: ModeType) => void;
  onToggleDrawer: () => void;
  onToggleRadar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenProfile?: () => void;
}

export const UserNavbar: React.FC<UserNavbarProps> = ({
  currentMode,
  onSelectMode,
  onToggleDrawer,
  onToggleRadar,
  searchQuery,
  onSearchChange,
  onOpenProfile,
}) => {
  return (
    <header className="fixed top-4 inset-x-4 z-50 pointer-events-none flex items-center justify-between gap-4">
      {/* Left Brand and Search */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <button
          className="p-2.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md hover:bg-surface-container-high transition-colors active:scale-95 text-primary border border-outline-variant shadow-sm"
          id="toggle-drawer-btn"
          onClick={onToggleDrawer}
          title="Toggle Command Drawer"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant shadow-sm">
          <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-base">spa</span>
          </div>
          <span className="font-heading font-bold text-lg text-primary tracking-tight leading-none lowercase">
            relife
          </span>
        </div>

        <div className="relative hidden sm:flex items-center w-52 md:w-60 shadow-sm rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant">
          <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-7 rounded-full bg-transparent text-xs placeholder:text-outline focus:outline-none border-none text-on-surface"
            placeholder="Search corridors, habitations..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-outline hover:text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* CENTER MODE 1 / MODE 2 PILL SWITCHER */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-20">
        <div className="flex items-center bg-surface-container-lowest/95 backdrop-blur-md rounded-full p-1 border border-outline-variant shadow-md">
          <button
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-heading font-bold transition-all active:scale-95 ${
              currentMode === 1
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => onSelectMode(1)}
            type="button"
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: currentMode === 1 ? "'FILL' 1" : "'FILL' 0" }}
            >
              radar
            </span>
            <span className="whitespace-nowrap">Mode 1: Threat Radar</span>
          </button>

          <button
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-heading font-bold transition-all active:scale-95 ${
              currentMode === 2
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => onSelectMode(2)}
            type="button"
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: currentMode === 2 ? "'FILL' 1" : "'FILL' 0" }}
            >
              alt_route
            </span>
            <span className="whitespace-nowrap">Mode 2: Relocation & Lifelines</span>
          </button>
        </div>
      </div>

      {/* Right Telemetry Badges & Status */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant text-[11px] font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse"></span>
          <span className="text-on-surface">BLE Mesh Online</span>
        </div>

        <button
          className="w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant shadow-sm flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
          onClick={onToggleRadar}
          title="Satellite Weather Radar HUD"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">satellite_alt</span>
        </button>

        <button
          className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm active:scale-95 transition-transform"
          onClick={onOpenProfile}
          title="Commander Profile"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">person</span>
        </button>
      </div>
    </header>
  );
};

export default UserNavbar;
