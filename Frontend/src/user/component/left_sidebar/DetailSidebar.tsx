import React from 'react';
import type { HazardEntity } from '../../types';

interface DetailSidebarProps {
  entity: HazardEntity | null;
  isOpen: boolean;
  isSidebarOpen?: boolean;
  isDrawerOpen?: boolean;
  onClose: () => void;
  onExpandReport: () => void;
  onCenterMap?: () => void;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  entity,
  isOpen,
  isSidebarOpen,
  isDrawerOpen,
  onClose,
  onExpandReport,
  onCenterMap,
}) => {
  if (!isOpen || !entity) return null;

  const hasSidebar = Boolean(isSidebarOpen ?? isDrawerOpen);

  return (
    <aside
      className={`fixed ${
        hasSidebar
          ? 'left-4 sm:left-[21.75rem] md:left-[26rem] w-80 md:w-96 lg:w-[26rem] max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-28rem)]'
          : 'left-4 w-80 md:w-[26rem] max-w-[calc(100vw-2rem)]'
      } top-20 bottom-4 z-40 bg-surface-container-lowest/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
      id="details-sidebar"
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-outline-variant/80 flex items-center justify-between bg-surface-container/80">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${entity.badgeClass}`}
            id="sidebar-badge"
          >
            <span className="material-symbols-outlined text-xs">crisis_alert</span>
            <span>{entity.category}</span>
          </span>
          <span className="text-[11px] text-on-surface-variant font-mono">{entity.id}</span>
        </div>
        <button
          className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          onClick={onClose}
          type="button"
          title="Close Details"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 tactical-scroll">
        <div>
          <h3 className="font-heading font-bold text-base text-on-surface">{entity.title}</h3>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{entity.desc}</p>
        </div>

        {/* Quantitative Telemetry Values */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface block mb-1.5">
            Quantitative Telemetry Values
          </span>
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-container border border-outline-variant text-center font-mono">
            <div>
              <div className="text-[10px] text-on-surface-variant font-sans">Safety FoS</div>
              <div className="text-xs font-bold text-error mt-0.5">{entity.telemetry.fos}</div>
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant font-sans">Precipitation</div>
              <div className="text-xs font-bold text-primary mt-0.5">{entity.telemetry.rain}</div>
            </div>
            <div>
              <div className="text-[10px] text-on-surface-variant font-sans">Saturation</div>
              <div className="text-xs font-bold text-error mt-0.5">{entity.telemetry.sat}</div>
            </div>
          </div>
        </div>

        {/* Official Guidelines */}
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/70 space-y-1">
          <h4 className="font-heading font-bold text-xs text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-sm">policy</span>
            <span>Official Guidelines</span>
          </h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">{entity.directives}</p>
        </div>

        {/* Verified Geo-Cam Evidence Thumbnails */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
              Verified Geo-Cam Ground Evidence
            </span>
            <span className="text-[10px] text-[#2e7d32] font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">verified</span> GPS Verified
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl overflow-hidden border border-outline-variant relative">
              <img
                alt="Fissure Ground Truth"
                className="w-full h-20 object-cover"
                src={entity.img1}
              />
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                Cam JOS-1
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-outline-variant relative">
              <img
                alt="River Bank Gauge"
                className="w-full h-20 object-cover"
                src={entity.img2}
              />
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                Gauge G4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer with Expand Button */}
      <div className="p-3 border-t border-outline-variant bg-surface-container flex items-center gap-2">
        <button
          className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-95 shadow-sm transition-all"
          onClick={onExpandReport}
          type="button"
        >
          <span>Expand Full Report</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </button>
        <button
          className="p-2.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95 transition-all"
          onClick={onCenterMap || (() => alert(`Map centered on ${entity.title}`))}
          title="Center on Map"
          type="button"
        >
          <span className="material-symbols-outlined text-base">center_focus_strong</span>
        </button>
      </div>
    </aside>
  );
};

export default DetailSidebar;
