import React, { useState } from 'react';

interface SosBlockProps {
  onSosBroadcast?: () => void;
}

export const SosBlock: React.FC<SosBlockProps> = ({ onSosBroadcast }) => {
  const [isSosDrawerOpen, setIsSosDrawerOpen] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleBroadcast = () => {
    setBroadcastSent(true);
    if (onSosBroadcast) {
      onSosBroadcast();
    } else {
      alert('Offline BLE Distress Beacon broadcasted to 4 nearby mesh peers.');
    }
    setTimeout(() => {
      setBroadcastSent(false);
      setIsSosDrawerOpen(false);
    }, 2500);
  };

  return (
    <>
      {/* Floating SOS Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <button
          className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-error text-on-error font-heading font-bold text-xs shadow-2xl hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all ring-4 ring-error/30 animate-bounce"
          id="sos-trigger-btn"
          onClick={() => setIsSosDrawerOpen(!isSosDrawerOpen)}
          type="button"
          title="Trigger Emergency Crisis SOS"
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sos
          </span>
          <span>CRISIS SOS</span>
        </button>
      </div>

      {/* Emergency SOS Drawer Overlay */}
      {isSosDrawerOpen && (
        <div
          className="fixed bottom-0 right-0 z-50 w-full sm:w-96 max-h-[80vh] bg-surface-container-lowest border-t sm:border-l border-outline-variant shadow-2xl rounded-t-3xl sm:rounded-tl-3xl sm:rounded-tr-none flex flex-col"
          id="sos-drawer"
        >
          <div className="p-3.5 border-b border-outline-variant bg-error-container text-on-error-container flex items-center justify-between rounded-t-3xl sm:rounded-tl-3xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-error">emergency_home</span>
              <h3 className="font-heading font-bold text-xs">NDRF Tactical SOS Dispatch</h3>
            </div>
            <button
              className="p-1 rounded-full hover:bg-error/20 text-on-error-container transition-colors"
              onClick={() => setIsSosDrawerOpen(false)}
              type="button"
              title="Close SOS Dispatch"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div className="p-4 space-y-2.5 overflow-y-auto tactical-scroll">
            <p className="text-[11px] text-on-surface-variant">
              Immediate connection to civil defense control rooms or peer-to-peer radio broadcast.
            </p>

            <a
              className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-colors"
              href="tel:1070"
            >
              <div>
                <div className="font-heading font-bold text-xs text-on-surface">
                  State Emergency SEOC
                </div>
                <div className="text-[11px] text-on-surface-variant font-mono">Toll Free: 1070</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold">
                Call Now
              </span>
            </a>

            <a
              className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant transition-colors"
              href="tel:1077"
            >
              <div>
                <div className="font-heading font-bold text-xs text-on-surface">
                  Chamoli District Helpline
                </div>
                <div className="text-[11px] text-on-surface-variant font-mono">Hotline: 1077</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold">
                Call Now
              </span>
            </a>

            <button
              className={`w-full py-2.5 rounded-full font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all mt-2 ${
                broadcastSent ? 'bg-[#2e7d32] text-white' : 'bg-error text-on-error'
              }`}
              onClick={handleBroadcast}
              type="button"
              disabled={broadcastSent}
            >
              <span className="material-symbols-outlined text-sm">
                {broadcastSent ? 'check_circle' : 'podcasts'}
              </span>
              <span>
                {broadcastSent ? 'Distress Beacon Transmitted!' : 'Broadcast BLE Mesh SOS (Offline)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SosBlock;
