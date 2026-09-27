import React, { useState } from 'react';
import type { GazetteOrderPayload } from '../../types';

interface AdminSosDirectivesProps {
  onBroadcastDirective?: (payload: GazetteOrderPayload) => void;
}

export const AdminSosDirectives: React.FC<AdminSosDirectivesProps> = ({
  onBroadcastDirective,
}) => {
  const [orderType, setOrderType] = useState('Section 144 Emergency Evacuation');
  const [targetSector, setTargetSector] = useState('Sector 4B (Joshimath Lower Town)');
  const [directiveText, setDirectiveText] = useState(
    'By order of District Magistrate / NDRF Command: Immediate cessation of civilian transit between Km 42 and Km 68. All residents directed to designated Transit Hubs.'
  );
  const [pushBleMeshSiren, setPushBleMeshSiren] = useState(true);
  const [isSigned, setIsSigned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: GazetteOrderPayload = {
      orderType,
      targetSector,
      directiveText,
      pushBleMeshSiren,
    };
    if (onBroadcastDirective) {
      onBroadcastDirective(payload);
    }
    setIsSigned(true);
    setTimeout(() => {
      setIsSigned(false);
    }, 3000);
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">history_edu</span>
          <h2 className="font-heading font-bold text-base text-on-surface">
            Gazette Relocation &amp; Emergency Orders
          </h2>
        </div>
        <span className="text-[11px] font-mono text-outline">ENDPOINT: /timeline/:id</span>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Publish legally binding relocation timelines, enforce Section 144 movement lockdowns, or dynamically redefine geospatial evacuation safe polygons across the valley mesh.
      </p>

      {isSigned ? (
        <div className="p-4 rounded-2xl bg-[#2e7d32]/10 border border-[#2e7d32]/30 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[#2e7d32]">verified</span>
          <div>
            <div className="font-heading font-bold text-xs text-[#1b5e20]">
              Gazette Executive Directive Cryptographically Signed & Broadcasted
            </div>
            <div className="text-[11px] text-on-surface-variant mt-0.5">
              Mesh siren and SMS broadcast sent to {targetSector}. Order ID #UK-SDRF-2024-EX-09.
            </div>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Gazette Order Type
              </label>
              <select
                className="w-full bg-surface rounded-full border border-outline-variant py-2 px-4 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
              >
                <option value="Section 144 Emergency Evacuation">Section 144 Emergency Evacuation</option>
                <option value="Corridor Closure & Heavy Traffic Halt">Corridor Closure &amp; Heavy Traffic Halt</option>
                <option value="Gazette Relocation Phase II Timeline">Gazette Relocation Phase II Timeline</option>
                <option value="Medical Airlift Priority Corridor">Medical Airlift Priority Corridor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Target Sector / Safe Zone
              </label>
              <select
                className="w-full bg-surface rounded-full border border-outline-variant py-2 px-4 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                value={targetSector}
                onChange={(e) => setTargetSector(e.target.value)}
              >
                <option value="Sector 4B (Joshimath Lower Town)">Sector 4B (Joshimath Lower Town)</option>
                <option value="Sector 3A (Pipalkoti Hub)">Sector 3A (Pipalkoti Hub)</option>
                <option value="Sector 1C (Gauchar Airstrip)">Sector 1C (Gauchar Airstrip)</option>
                <option value="Sector 6 (Mana Village Border Pass)">Sector 6 (Mana Village Border Pass)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              Executive Order Directive Text (Bilingual Dissemination)
            </label>
            <textarea
              className="w-full bg-surface rounded-2xl border border-outline-variant p-3.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none placeholder:text-outline text-on-surface"
              placeholder="By order of District Magistrate / NDRF Command..."
              rows={3}
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={pushBleMeshSiren}
                  className="sr-only peer"
                  type="checkbox"
                  onChange={(e) => setPushBleMeshSiren(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-[11px] text-on-surface-variant font-semibold">
                Push BLE Mesh Siren Alert
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-heading font-bold transition-colors border border-outline-variant"
                onClick={() => alert(`Previewing Gazette PDF Directive for: ${targetSector}`)}
                type="button"
              >
                Preview Gazette PDF
              </button>
              <button
                className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container transition-all active:scale-95 shadow-sm"
                type="submit"
              >
                Sign &amp; Broadcast Directive
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSosDirectives;
