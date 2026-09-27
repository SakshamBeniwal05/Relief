import React from 'react';

interface CommanderHeaderStripProps {
  onSwitchToMapHud?: () => void;
}

export const CommanderHeaderStrip: React.FC<CommanderHeaderStripProps> = ({
  onSwitchToMapHud,
}) => {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 md:p-6 border border-outline-variant/50 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Commander Bio & Auth Badge */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <img
              alt="Col. Rajeshwar Sharma"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHdjicY2OKAIWXT5XfrjypOnMQUwJf63L7GZdd5viepp7wVCZDyE9ec4QGvC4DEljejYX-FDyOJOqo6Zy93wdSWx8IxBXmrPqve7ZCUuAHwuwpvMbTf9aHhJHTE2a0OB4NPnLT7BMwyk1cl4evbjJDJHHp8HiDvx_2EuadmjgyW3cAxYkiSBFy1Zs3TZTzzrEDFUpsSkTzcYXd3u45IhxFId1aAJxmejLa5IRRy1XovvwQauhkIFQ"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-[12px]">
              <span className="material-symbols-outlined text-[14px]">verified</span>
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-heading font-bold text-lg text-on-surface">
                Col. Rajeshwar Sharma, VSM
              </h1>
              <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                DEFCON-ALPHA
              </span>
              <span className="bg-surface-container-high text-outline px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                AUTH-NDRF-9942
              </span>
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
              Nodal Disaster Commissioner (Uttarakhand SDRF/NDRF Command Sector 4)
            </p>
          </div>
        </div>

        {/* Shortcuts Navigation Cluster */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center">
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-heading font-bold transition-all active:scale-95 border border-outline-variant"
            onClick={onSwitchToMapHud || (() => alert('Switching to Map HUD...'))}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">map</span>
            <span>Tactical Map HUD</span>
          </button>

          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold transition-all active:scale-95 shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Admin Dashboard</span>
          </button>

          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-heading font-bold transition-all active:scale-95 border border-outline-variant"
            onClick={() => alert('Accessing NDRF cryptographic logs...')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Audit Logs</span>
          </button>

          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-heading font-bold transition-all active:scale-95 border border-outline-variant"
            onClick={() => alert('Opening command center settings...')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Quick Status Telemetry Bar */}
      <div className="mt-6 pt-5 border-t border-outline-variant/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">speed</span>
          </div>
          <div>
            <span className="text-[10px] text-outline block">System Uptime</span>
            <span className="text-xs font-bold text-on-surface">99.98% High SLA</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">hub</span>
          </div>
          <div>
            <span className="text-[10px] text-outline block">BLE Mesh Nodes</span>
            <span className="text-xs font-bold text-on-surface">148 Relays Syncing</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
          </div>
          <div>
            <span className="text-[10px] text-outline block">Ingestion Pipeline</span>
            <span className="text-xs font-bold text-on-surface">Nominal (Zero Backlog)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </div>
          <div>
            <span className="text-[10px] text-outline block">Field Volunteers</span>
            <span className="text-xs font-bold text-on-surface">412 On-Ground</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommanderHeaderStrip;
