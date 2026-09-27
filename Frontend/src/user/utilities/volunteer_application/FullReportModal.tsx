import React from 'react';
import type { HazardEntity } from '../../types';

interface FullReportModalProps {
  entity: HazardEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateReport: () => void;
}

export const FullReportModal: React.FC<FullReportModalProps> = ({
  entity,
  isOpen,
  onClose,
  onOpenCreateReport,
}) => {
  if (!isOpen || !entity) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      id="report-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        {/* Header with Alert Severity */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              onClick={onClose}
              type="button"
              title="Back to Map View"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${entity.badgeClass}`}>
                  {entity.category}
                </span>
                <span className="text-xs text-on-surface-variant font-mono">Record {entity.id}</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-on-surface mt-0.5">
                {entity.title} Incident Dossier
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hidden sm:flex px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-heading font-bold items-center gap-1 transition-all"
              onClick={() => alert('Exporting official cryptographically signed PDF dossier...')}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export PDF</span>
            </button>
            <button
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 tactical-scroll">
          {/* Alert Severity Banner */}
          <div className="p-4 rounded-2xl bg-error-container border border-error/30 text-on-error-container flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-error shrink-0">report</span>
            <div>
              <div className="font-heading font-bold text-sm">
                Live Telemetry Dossier: {entity.title}
              </div>
              <p className="text-xs mt-0.5 leading-relaxed">{entity.desc}</p>
            </div>
          </div>

          {/* Quantitative Values */}
          <div>
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">speed</span>
              <span>Quantitative Telemetry Values</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                <div className="text-[10px] text-on-surface-variant font-sans">Factor of Safety</div>
                <div className="text-base font-bold text-error mt-0.5">{entity.telemetry.fos}</div>
                <div className="text-[10px] text-error">Unstable (&lt;1.0)</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                <div className="text-[10px] text-on-surface-variant font-sans">Rainfall Rate</div>
                <div className="text-base font-bold text-primary mt-0.5">{entity.telemetry.rain}</div>
                <div className="text-[10px] text-primary">Heavy Monsoonal</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                <div className="text-[10px] text-on-surface-variant font-sans">Soil Saturation</div>
                <div className="text-base font-bold text-error mt-0.5">{entity.telemetry.sat}</div>
                <div className="text-[10px] text-error">Critical High</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                <div className="text-[10px] text-on-surface-variant font-sans">Pore Pressure</div>
                <div className="text-base font-bold text-on-surface mt-0.5">{entity.telemetry.pore}</div>
                <div className="text-[10px] text-error">+18% Surge</div>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant col-span-2 sm:col-span-1">
                <div className="text-[10px] text-on-surface-variant font-sans">Slope Tilt</div>
                <div className="text-base font-bold text-tertiary mt-0.5">{entity.telemetry.tilt}</div>
                <div className="text-[10px] text-tertiary">Active Creep</div>
              </div>
            </div>
          </div>

          {/* Official Guidelines */}
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-primary text-base">gavel</span>
              <span>Official Guidelines &amp; Section 144 Directives</span>
            </h4>
            <ol className="text-xs text-on-surface-variant space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Mandatory evacuation for premises marked with red CBRI spray tags prior to 18:00 hrs.</li>
              <li>Do not traverse the NH-58 canyon road; follow marked green transit corridor towards Gauchar Hub.</li>
              <li>Registration tokens are compulsory for Direct Benefit Transfer (DBT) ex-gratia claims.</li>
              <li>Offline radios must remain tuned to emergency disaster broadcast frequency 102.4 MHz FM.</li>
            </ol>
          </div>

          {/* Verified Evidence Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface">
                  Images by Other Users Verified with Geo Cam
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Hardware-signed evidence preventing misinformation and fake alarms
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                onClick={onOpenCreateReport}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                <span>Create Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container">
                <img
                  alt="Field Capture 1"
                  className="w-full h-36 object-cover"
                  src={entity.img1}
                />
                <div className="p-3 bg-surface-container-low text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-primary font-mono">Hardware GPS: 30.556° N, 79.563° E</span>
                    <span className="text-[#2e7d32] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span> CV Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Clock Drift: 12s (Pass)</span>
                    <span>Sensor: Sony IMX686 TEE</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container">
                <img
                  alt="Field Capture 2"
                  className="w-full h-36 object-cover"
                  src={entity.img2}
                />
                <div className="p-3 bg-surface-container-low text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-primary font-mono">Hardware GPS: 30.512° N, 79.521° E</span>
                    <span className="text-[#2e7d32] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span> Geo-Crypt Pass
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Runoff: 4.8 m/s</span>
                    <span>Station: UK-SDMA-G4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-outline-variant bg-surface-container flex items-center justify-between">
          <span className="text-[11px] font-mono text-on-surface-variant">
            Auth Registry: NDRF-UK-9042
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-full border border-outline text-on-surface text-xs font-heading font-bold"
              onClick={onClose}
              type="button"
            >
              Back to Map
            </button>
            <button
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold shadow-sm"
              onClick={onClose}
              type="button"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullReportModal;
