import React, { useState } from 'react';
import type { ModeType, Mode1Filter, Mode2SubTab } from '../../types';

interface TacticalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ModeType;
  onSelectEntity: (key: string) => void;
  onOpenVolunteerModal: () => void;
  onOpenMapSettings?: () => void;
}

export const TacticalDrawer: React.FC<TacticalDrawerProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectEntity,
  onOpenVolunteerModal,
  onOpenMapSettings,
}) => {
  const [mode1Filter, setMode1Filter] = useState<Mode1Filter>('official');
  const [mode2SubTab, setMode2SubTab] = useState<Mode2SubTab>('queues');

  return (
    <aside
      className={`fixed left-4 top-20 bottom-4 z-30 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-[115%]'
      }`}
      id="tactical-drawer"
    >
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-outline-variant/80 flex items-center justify-between bg-surface-container/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-sm">
              {currentMode === 1 ? 'policy' : 'alt_route'}
            </span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-on-surface">
              {currentMode === 1 ? 'Threat Radar & Alerts' : 'Relocation & Lifelines'}
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              {currentMode === 1
                ? 'Government Directives & AI Forewarning'
                : 'Habitations, Shelters & Gazette Timelines'}
            </p>
          </div>
        </div>
        <button
          className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors active:scale-95 text-on-surface-variant"
          onClick={onClose}
          type="button"
          title="Close drawer"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      </div>

      {/* MODE 1 INNER LIST */}
      {currentMode === 1 && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 tactical-scroll">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full text-[11px] font-bold sticky top-0 z-10 backdrop-blur-md">
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'official'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('official')}
              type="button"
            >
              Gov Directives
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'ai'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('ai')}
              type="button"
            >
              AI Predictions
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode1Filter === 'updates'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode1Filter('updates')}
              type="button"
            >
              Local Updates
            </button>
          </div>

          {/* Alert Item 1: Joshimath */}
          {(mode1Filter === 'official' || mode1Filter === 'ai') && (
            <div
              className="group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 border-error shadow-xs transition-all"
              onClick={() => onSelectEntity('joshimath')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-error flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span> CRITICAL • SECTION 144
                </span>
                <span className="text-[11px] text-on-surface-variant">04m ago</span>
              </div>
              <h3 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                Joshimath Ravigram Sector
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                Slope subsidence acceleration detected. Factor of Safety degraded to 0.84. 14 units flagged for emergency relocation.
              </p>
              <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold text-primary">
                <span>FoS: 0.84 | Rain: 84mm/h</span>
                <span className="flex items-center gap-0.5 group-hover:underline">
                  Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </span>
              </div>
            </div>
          )}

          {/* Alert Item 2: Alaknanda */}
          {(mode1Filter === 'official' || mode1Filter === 'updates') && (
            <div
              className="group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 border-error shadow-xs transition-all"
              onClick={() => onSelectEntity('alaknanda')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-error flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span> FLASH FLOOD VECTOR
                </span>
                <span className="text-[11px] text-on-surface-variant">12m ago</span>
              </div>
              <h3 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                Alaknanda Surge: Pipalkoti Hub
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                Gauge station G-4 discharge crossed safe spillway capacity at 1,024 m³/s. Riverfront buffer cleared.
              </p>
              <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold text-primary">
                <span>Discharge: 1,024 m³/s</span>
                <span className="flex items-center gap-0.5 group-hover:underline">
                  Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </span>
              </div>
            </div>
          )}

          {/* Alert Item 3: Chamoli Slip */}
          <div
            className="group cursor-pointer p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border-l-4 border-tertiary-container shadow-xs transition-all"
            onClick={() => onSelectEntity('chamoli')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> HIGH SLIP RISK • ROAD CUT
              </span>
              <span className="text-[11px] text-on-surface-variant">28m ago</span>
            </div>
            <h3 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
              Chamoli NH-58 Blockade Slip
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
              Talus debris rockfall at KM post 214. Highway completely severed. Reroute via Helang bypass.
            </p>
            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold text-tertiary">
              <span>NH-58 Blocked</span>
              <span className="flex items-center gap-0.5 text-primary group-hover:underline font-bold">
                Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2 INNER LIST */}
      {currentMode === 2 && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 tactical-scroll">
          {/* Sub Tabs inside Mode 2 */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-full text-[11px] font-bold sticky top-0 z-10 backdrop-blur-md">
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'queues'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('queues')}
              type="button"
            >
              Habitations
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'shelters'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('shelters')}
              type="button"
            >
              Safe Shelters
            </button>
            <button
              className={`flex-1 py-1 rounded-full transition-all ${
                mode2SubTab === 'timelines'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setMode2SubTab('timelines')}
              type="button"
            >
              Gazette
            </button>
          </div>

          {/* Habitations Subpanel */}
          {mode2SubTab === 'queues' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-on-surface uppercase tracking-wider">Relocation Priority Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">1,840 Families</span>
              </div>

              {/* Habitation 1: Joshimath Ravigram */}
              <div
                className="p-3 rounded-2xl bg-surface-container-low border-l-4 border-error shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectEntity('joshimath')}
              >
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-error flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span> Rank #1 • Immediate (0-3M)
                  </span>
                  <span className="text-on-surface-variant">412 Families</span>
                </div>
                <h4 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                  Joshimath Ravigram Sector
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Displacement rate 14.2 mm/day. 68 structures red-flagged.</p>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold">
                  <span className="text-error">FoS: 0.84</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>

              {/* Habitation 2: Sunil Ward */}
              <div
                className="p-3 rounded-2xl bg-surface-container-low border-l-4 border-tertiary-container shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectEntity('sunil_ward')}
              >
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <span className="font-bold text-tertiary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> Rank #2 • Short-term (3-12M)
                  </span>
                  <span className="text-on-surface-variant">630 Families</span>
                </div>
                <h4 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                  Sunil Ward Upper Terrace
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Slope angle 34°. High groundwater pressure registered.</p>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-outline-variant/60 text-[11px] font-bold">
                  <span className="text-tertiary">FoS: 1.08</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>
            </div>
          )}

          {/* Safe Shelters Subpanel */}
          {mode2SubTab === 'shelters' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-on-surface uppercase tracking-wider">Active Safe Shelters</span>
                <span className="px-2 py-0.5 rounded-full bg-[#2e7d32] text-white">3 Operational</span>
              </div>
              <div
                className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectEntity('shelter_gauchar')}
              >
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                  <span className="text-[#2e7d32] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">night_shelter</span> Terminal 01 (Airstrip)
                  </span>
                  <span className="text-[#2e7d32]">58 Beds Free</span>
                </div>
                <h4 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary">
                  Gauchar Field Station Airstrip
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Primary staging center with triage, helipad, and rations.
                </p>
                <div className="mt-2 text-[11px] font-bold flex justify-between pt-1.5 border-t border-outline-variant/60">
                  <span className="text-on-surface-variant">Capacity: 142/200 (71%)</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>
            </div>
          )}

          {/* Gazette Timelines Subpanel */}
          {mode2SubTab === 'timelines' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-on-surface uppercase tracking-wider">Government Gazette Orders</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">UK-2024-88</span>
              </div>
              <div
                className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                onClick={() => onSelectEntity('gazette')}
              >
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">history_edu</span> Relief & Compensation
                  </span>
                  <span className="text-on-surface-variant">Oct 12 Target</span>
                </div>
                <h4 className="font-heading font-bold text-xs text-on-surface group-hover:text-primary">
                  Phase 1 DBT Ex-gratia Disbursement
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  ₹1.5 Lakh/family direct bank transfer to 412 red-tagged households.
                </p>
                <div className="mt-2 text-[11px] font-bold flex justify-between pt-1.5 border-t border-outline-variant/60">
                  <span className="text-on-surface-variant">412 Beneficiaries</span>
                  <span className="text-primary group-hover:underline">Inspect Details →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer Footer Actions */}
      <div className="p-3 border-t border-outline-variant/80 bg-surface-container/60 backdrop-blur-sm flex flex-col gap-2">
        {currentMode === 2 && (
          <button
            className="w-full py-2.5 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            onClick={onOpenVolunteerModal}
            type="button"
          >
            <span className="material-symbols-outlined text-base">assignment_ind</span>
            <span>Apply as Volunteer</span>
          </button>
        )}
        <div className="flex items-center justify-between text-[11px] font-bold px-1 text-on-surface-variant">
          <button
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={onOpenMapSettings}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">tune</span> Map Settings
          </button>
          <button
            className="flex items-center gap-1 hover:text-primary transition-colors"
            onClick={() => alert('Legend: Red=Active Landslide/Flooding; Green=Verified Safe Route & Shelter')}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">layers</span> Legend Layers
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TacticalDrawer;
