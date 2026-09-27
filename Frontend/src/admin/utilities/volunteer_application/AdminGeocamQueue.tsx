import React, { useState } from 'react';
import type { GeoIncident } from '../../types';

interface AdminGeocamQueueProps {
  initialIncidents: GeoIncident[];
  onVerifyAndPushMap?: (id: string) => void;
  onEscalateSdrf?: (id: string) => void;
}

export const AdminGeocamQueue: React.FC<AdminGeocamQueueProps> = ({
  initialIncidents,
  onVerifyAndPushMap,
  onEscalateSdrf,
}) => {
  const [incidents, setIncidents] = useState<GeoIncident[]>(initialIncidents);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleVerify = (id: string, title: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'verified' } : inc))
    );
    if (onVerifyAndPushMap) onVerifyAndPushMap(id);
    showFeedback(`Incident "${title}" verified & pushed to public GIS map!`);
  };

  const handleEscalate = (id: string, title: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'escalated' } : inc))
    );
    if (onEscalateSdrf) onEscalateSdrf(id);
    showFeedback(`Escalated to SDRF Quick Reaction Team for "${title}"!`);
  };

  const handleDismiss = (id: string, title: string) => {
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
    showFeedback(`Dismissed report "${title}" as invalid.`);
  };

  return (
    <section className="space-y-4" id="geocam-stream">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[24px]">verified</span>
            <h2 className="font-heading font-bold text-base text-on-surface">
              Anti-Prank Geo-Cam Incident Moderation Queue
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Hardware cryptographic EXIF tamper-detection and AI Computer Vision landslide debris assessment before pushing to public GIS.
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 bg-surface-container-high text-on-surface rounded-full self-start">
          {incidents.length} Pending Verification
        </span>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row gap-5"
          >
            {/* Thumbnail & Location Preview */}
            <div className="md:w-44 shrink-0 space-y-2">
              <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-square bg-surface-container">
                <img
                  alt={incident.title}
                  className="w-full h-full object-cover"
                  src={incident.photoUrl}
                />
                <span
                  className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    incident.severity === 'HIGH SEVERITY'
                      ? 'bg-error text-on-error'
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <div className="text-[11px] text-outline font-mono text-center">
                {incident.coordinates}
              </div>
            </div>

            {/* EXIF & CV Telemetry */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-xs text-on-surface">
                    {incident.title}
                  </h3>
                  <span className="text-[11px] text-outline">{incident.timeAgo}</span>
                </div>

                {/* Telemetry Validation Matrix */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-xl bg-surface border border-outline-variant/50">
                    <span className="text-[10px] text-outline block">GPS Delta Error</span>
                    <span className="text-xs font-bold text-primary">{incident.gpsDelta}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-outline-variant/50">
                    <span className="text-[10px] text-outline block">UTC Hardware Clock</span>
                    <span className="text-xs font-bold text-primary">
                      {incident.hardwareClockStatus}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-outline-variant/50 col-span-2">
                    <div className="flex justify-between text-[10px] text-outline mb-1">
                      <span>CV Landslide Debris Confidence</span>
                      <span className="font-bold text-on-surface">
                        {incident.cvConfidence}% Match
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${incident.cvConfidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/50">
                {incident.status === 'verified' ? (
                  <span className="flex-1 py-1.5 rounded-full bg-[#2e7d32]/20 text-[#1b5e20] text-xs font-bold text-center">
                    Verified on Public GIS Map
                  </span>
                ) : incident.status === 'escalated' ? (
                  <span className="flex-1 py-1.5 rounded-full bg-error-container text-error text-xs font-bold text-center">
                    SDRF Rapid Team Dispatched
                  </span>
                ) : (
                  <>
                    <button
                      className="flex-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container transition-all active:scale-95 shadow-sm text-center"
                      onClick={() => handleVerify(incident.id, incident.title)}
                      type="button"
                    >
                      Verify &amp; Push Map
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-heading font-bold hover:bg-error hover:text-on-error transition-all active:scale-95"
                      onClick={() => handleEscalate(incident.id, incident.title)}
                      type="button"
                    >
                      Escalate SDRF
                    </button>
                    <button
                      className="p-1.5 rounded-full hover:bg-surface-container-highest text-outline transition-colors"
                      onClick={() => handleDismiss(incident.id, incident.title)}
                      title="Mark False or Dismiss"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">block</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminGeocamQueue;
