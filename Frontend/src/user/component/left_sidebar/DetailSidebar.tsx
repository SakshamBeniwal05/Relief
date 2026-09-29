import React from 'react';
import type { HazardEntity } from '../../types';

interface DetailSidebarProps {
  entity: HazardEntity | null;
  isOpen: boolean;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  onClose: () => void;
  onExpandReport: () => void;
  onCenterMap?: () => void;
  onOpenRehabilitationModal?: () => void;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  entity,
  isOpen,
  isDrawerOpen = false,
  onToggleDrawer,
  onClose,
  onExpandReport,
  onCenterMap,
  onOpenRehabilitationModal,
}) => {
  if (!isOpen || !entity) return null;

  // When drawer is open: dock adjacent on md+ screens (left-4 on mobile)
  // When drawer is closed: dock in sidebar location (left-4)
  const positionClasses = isDrawerOpen
    ? 'left-4 md:left-[25.75rem] md:max-w-[calc(100vw-27.5rem)]'
    : 'left-4 max-w-[calc(100vw-2rem)]';

  return (
    <aside
      className={`fixed top-20 bottom-4 z-40 w-80 md:w-[26rem] bg-white text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${positionClasses}`}
      id="details-sidebar"
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
        <div className="flex items-center gap-2">
          {onToggleDrawer && (
            <button
              className="hidden md:flex p-1.5 rounded-full hover:bg-zinc-200 text-zinc-600 transition-colors"
              onClick={onToggleDrawer}
              title={isDrawerOpen ? 'Collapse list drawer' : 'Expand list drawer'}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {isDrawerOpen ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${entity.badgeClass}`}
            id="sidebar-badge"
          >
            <span className="material-symbols-outlined text-xs">crisis_alert</span>
            <span>{entity.category}</span>
          </span>
          <span className="text-xs text-zinc-500 font-mono font-medium">{entity.id}</span>
        </div>
        <button
          className="p-1 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors"
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
          <h3 className="font-heading font-bold text-xl text-zinc-900 tracking-tight">{entity.title}</h3>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{entity.desc}</p>
        </div>

        {/* Dynamic Risk Zoning & Relocation Score Panel */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">shield</span>
              Dynamic Risk Zoning
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                entity.zone === 'RED'
                  ? 'bg-error text-white'
                  : entity.zone === 'YELLOW'
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#2e7d32] text-white'
              }`}
            >
              {entity.zone || 'RED'} ZONE • {entity.riskLevel || 'HIGH RISK'}
            </span>
          </div>

          {/* 0-100 Gauge Needle Meter */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
              <span className="text-zinc-500 text-[11px]">0-100 RELOCATION RISK SCORE</span>
              <span
                className="text-lg font-black"
                style={{
                  color:
                    entity.zone === 'RED' ? '#d32f2f' : entity.zone === 'YELLOW' ? '#ed6c02' : '#2e7d32',
                }}
              >
                {entity.riskScore ?? 74.8} <span className="text-xs font-normal text-zinc-500">/ 100</span>
              </span>
            </div>

            {/* Tri-color horizontal gauge gradient with score needle marker */}
            <div className="relative pt-2 pb-1">
              <div className="h-2.5 rounded-full w-full bg-linear-to-r from-emerald-500 via-amber-400 to-red-600 shadow-inner overflow-hidden" />
              {/* Needle Indicator */}
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                style={{
                  left: `${Math.min(97, Math.max(3, entity.riskScore ?? 74.8))}%`,
                }}
              >
                <div className="w-2.5 h-2.5 rotate-45 bg-zinc-900 shadow-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium mt-0.5 font-mono">
              <span className="text-emerald-700 font-bold">0 (LOW RISK)</span>
              <span className="text-amber-700 font-bold">50 (MODERATE)</span>
              <span className="text-red-700 font-bold">100 (HIGH RISK)</span>
            </div>
          </div>

          {/* Relocation Preparedness Action Callout */}
          <div className="p-3 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-900 flex items-center gap-1 font-heading">
                <span className="material-symbols-outlined text-xs text-primary">alt_route</span>
                Relocation Preparedness
              </span>
              <span className="text-[11px] text-primary font-mono font-bold">
                Priority #{entity.priorityRank || 1}
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-900">
              {entity.relocationPreparedness || 'Prepare for Immediate Relocation (0-3 Months)'}
            </p>
            {entity.actionProtocol && (
              <p className="text-xs text-zinc-600 leading-relaxed pt-1 border-t border-zinc-100">
                {entity.actionProtocol}
              </p>
            )}
          </div>
        </div>

        {/* Two-Tier Impact Radii: Real (Red, Yellow, Green) vs AI Predicted (Purple, Blue, Light-Blue) */}
        <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-700">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">radar</span>
              Two-Tier Impact Radii
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
              Ground vs AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 1. Real Ground Impact Radius (Red, Yellow, Green) */}
            <div className={`p-2 rounded-xl border flex flex-col justify-between ${
              (entity.zone === 'RED' || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli'))
                ? 'bg-red-50 text-red-900 border-red-200'
                : (entity.zone === 'YELLOW' || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil'))
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                <span className={`w-2 h-2 rounded-full ${
                  (entity.zone === 'RED' || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli'))
                    ? 'bg-red-600'
                    : (entity.zone === 'YELLOW' || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil'))
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`} />
                <span>1. Real Ground Radius</span>
              </div>
              <div className="mt-1">
                <div className="text-base font-black font-mono">
                  {entity.title?.toLowerCase().includes('joshimath') ? '3.2 km' : entity.title?.toLowerCase().includes('chamoli') ? '2.4 km' : entity.title?.toLowerCase().includes('sunil') ? '2.1 km' : entity.title?.toLowerCase().includes('alaknanda') ? '4.8 km' : entity.title?.toLowerCase().includes('gauchar') ? '5.0 km' : '3.5 km'}
                </div>
                <div className="text-[10px] font-bold opacity-80">
                  {entity.zone === 'RED' || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli')
                    ? '🔴 Red (High Risk)'
                    : entity.zone === 'YELLOW' || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil')
                    ? '🟡 Yellow (Moderate)'
                    : '🟢 Green (Safe Hub)'}
                </div>
              </div>
            </div>

            {/* 2. AI Predicted Forewarning Radius (Purple, Blue, Light-Blue) */}
            <div className={`p-2 rounded-xl border flex flex-col justify-between ${
              (entity.riskScore ?? 75) >= 70 || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli')
                ? 'bg-purple-50 text-purple-900 border-purple-200'
                : (entity.riskScore ?? 75) >= 40 || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil')
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-sky-50 text-sky-900 border-sky-200'
            }`}>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                <span className={`w-2 h-2 rounded-full border border-dashed ${
                  (entity.riskScore ?? 75) >= 70 || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli')
                    ? 'bg-purple-600 border-purple-600'
                    : (entity.riskScore ?? 75) >= 40 || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil')
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-sky-500 border-sky-500'
                }`} />
                <span>2. AI Predicted Radius</span>
              </div>
              <div className="mt-1">
                <div className="text-base font-black font-mono">
                  {entity.title?.toLowerCase().includes('joshimath') ? '5.2 km' : entity.title?.toLowerCase().includes('chamoli') ? '4.0 km' : entity.title?.toLowerCase().includes('sunil') ? '3.8 km' : entity.title?.toLowerCase().includes('alaknanda') ? '8.5 km' : entity.title?.toLowerCase().includes('gauchar') ? '12.0 km' : '5.2 km'}
                </div>
                <div className="text-[10px] font-bold opacity-80">
                  {(entity.riskScore ?? 75) >= 70 || entity.title?.toLowerCase().includes('joshimath') || entity.title?.toLowerCase().includes('chamoli')
                    ? '🟣 Purple (70-100)'
                    : (entity.riskScore ?? 75) >= 40 || entity.title?.toLowerCase().includes('alaknanda') || entity.title?.toLowerCase().includes('sunil')
                    ? '🔵 Blue (40-69.9)'
                    : '💧 Light-Blue (0-39.9)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quantitative Telemetry Values */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
            Quantitative Telemetry Values
          </span>
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-center font-mono">
            <div>
              <div className="text-[10px] text-zinc-500 font-sans font-semibold">Safety FoS</div>
              <div className="text-sm font-bold text-red-600 mt-0.5">{entity.telemetry.fos}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-sans font-semibold">Precipitation</div>
              <div className="text-sm font-bold text-blue-600 mt-0.5">{entity.telemetry.rain}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-sans font-semibold">Saturation</div>
              <div className="text-sm font-bold text-amber-600 mt-0.5">{entity.telemetry.sat}</div>
            </div>
          </div>
        </div>

        {/* Official Guidelines */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
          <h4 className="font-heading font-bold text-sm text-zinc-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">policy</span>
            <span>Official Guidelines</span>
          </h4>
          <p className="text-xs text-zinc-600 leading-relaxed">{entity.directives}</p>
        </div>

        {/* Verified Geo-Cam Evidence Thumbnails */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Verified Geo-Cam Ground Evidence
            </span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">verified</span> GPS Verified
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl overflow-hidden border border-zinc-200 relative">
              <img
                alt="Fissure Ground Truth"
                className="w-full h-20 object-cover"
                src={entity.img1}
              />
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                Cam JOS-1
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-zinc-200 relative">
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

        {/* Physical Document Submission Callout */}
        {(entity.id === 'gazette' || entity.category.includes('RELIEF') || onOpenRehabilitationModal) && (
          <button
            className="w-full p-3 rounded-2xl bg-red-50 text-red-950 border border-red-200 font-heading font-bold text-xs flex items-center justify-between shadow-2xs hover:bg-red-100 transition-all active:scale-95 group text-left"
            onClick={onOpenRehabilitationModal}
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-red-600">checklist</span>
              <div>
                <div className="font-bold text-red-900">Physical Document Submission Checklist</div>
                <div className="text-[10px] text-red-700">14 Days Remaining before legal forfeiture</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-sm text-red-600 group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* Sidebar Footer with Expand Button */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center gap-2">
        <button
          className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-95 shadow-sm transition-all"
          onClick={onExpandReport}
          type="button"
        >
          <span>Expand Full Report</span>
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </button>
        <button
          className="p-2.5 rounded-full bg-zinc-200 text-zinc-700 hover:bg-zinc-300 active:scale-95 transition-all"
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
