import React, { useState, useEffect } from 'react';

export interface EmergencyBroadcastAlert {
  id: string;
  orderType: string;
  directiveText: string;
  targetSector: string;
  sectorCoords: { lat: number; lng: number };
  threatRadiusMeters: number;
  threatCategory?: string;
  threatSeverity?: 'CRITICAL' | 'SEVERE' | 'ADVISORY' | string;
  authorizedBy: string;
  timestamp: string;
  liveWeather?: {
    tempC?: number;
    rainMmh?: number;
    humidity?: number;
    soilSatPct?: number;
    source?: string;
  };
}

interface BroadcastAlertModalProps {
  alert: EmergencyBroadcastAlert | null;
  userCoords: { lat: number; lng: number };
  onClose: () => void;
  onNavigateToShelter?: () => void;
}

/**
 * Computes Haversine distance in meters
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const BroadcastAlertModal: React.FC<BroadcastAlertModalProps> = ({
  alert,
  userCoords,
  onClose,
  onNavigateToShelter,
}) => {
  if (!alert) return null;

  const distanceMeters = calculateDistanceMeters(
    userCoords.lat,
    userCoords.lng,
    alert.sectorCoords.lat,
    alert.sectorCoords.lng
  );

  // 20km impact buffer rule (identical to local update tracking: d <= R + 20 km)
  const threatRadius = alert.threatRadiusMeters || 3200;
  const bufferThresholdMeters = threatRadius + 20000; // 20km range after impact radius
  const isWithinRange = distanceMeters <= bufferThresholdMeters;
  const isInsideDirectImpact = distanceMeters <= threatRadius;

  // Countdown timer state
  // Center modal (within range): Self-closing after 10 seconds
  // Top-right toast (outside range): Self-closing after 5 seconds
  const [fadeProgress, setFadeProgress] = useState(100);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(isWithinRange ? 10 : 5);

  useEffect(() => {
    setIsFadingOut(false);
    setFadeProgress(100);

    const durationMs = isWithinRange ? 10000 : 5000;
    setSecondsRemaining(isWithinRange ? 10 : 5);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setFadeProgress(remainingPct);
      setSecondsRemaining(Math.ceil(Math.max(0, durationMs - elapsed) / 1000));

      if (elapsed >= durationMs - 500) {
        setIsFadingOut(true);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [alert.id, isWithinRange, onClose]);

  // -------------------------------------------------------------------------
  // CASE 1: WITHIN RANGE (d <= Impact Radius + 20km)
  // Pops in CENTER OF THE SCREEN with BACKGROUND BLUR and is SELF-CLOSING (10s)
  // -------------------------------------------------------------------------
  if (isWithinRange) {
    return (
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none transition-all duration-500 ${
          isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 animate-fadeIn'
        }`}
        id="critical-threat-center-modal"
      >
        <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl border-2 border-error shadow-2xl overflow-hidden flex flex-col ring-8 ring-error/20">
          {/* Header Strip with Siren, Title, and Manual Close [X] Button */}
          <div className="p-4 bg-error text-on-error flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-2xl animate-bounce">
                crisis_alert
              </span>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase block text-white/90">
                  {isInsideDirectImpact
                    ? 'DEFCON 1 • CORE IMPACT ZONE'
                    : 'TACTICAL ALERT • WITHIN 20KM BUFFER'}
                </span>
                <h3 className="font-heading font-black text-sm uppercase">
                  {alert.orderType || 'OFFICIAL GOVERNMENT EMERGENCY ALERT'}
                </h3>
              </div>
            </div>
            {/* Cross close button on notification card so user can also manually close */}
            <button
              className="p-1.5 rounded-full hover:bg-black/20 text-on-error transition-colors flex items-center justify-center cursor-pointer"
              onClick={onClose}
              type="button"
              title="Close immediately"
            >
              <span className="material-symbols-outlined text-2xl font-bold">close</span>
            </button>
          </div>

          {/* Main Card Body */}
          <div className="p-6 space-y-4">
            {/* Proximity Warning Badge */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                isInsideDirectImpact
                  ? 'bg-error-container/70 border-error/50 text-error'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
                <span>
                  {isInsideDirectImpact
                    ? 'INSIDE DIRECT IMPACT ZONE'
                    : 'WITHIN 20KM LOCAL TRACKING BUFFER'}
                </span>
              </div>
              <span className="font-mono font-bold">
                {distanceMeters < 1000
                  ? `${Math.round(distanceMeters)}m from epicenter`
                  : `${(distanceMeters / 1000).toFixed(1)}km from epicenter`}
              </span>
            </div>

            {/* WHAT */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-outline">
                  WHAT: Official Government Directive
                </label>
                {alert.threatCategory && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-error/10 text-error">
                    {alert.threatCategory}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface leading-relaxed font-medium bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
                {alert.directiveText}
              </p>
            </div>

            {/* WHERE */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-outline">
                WHERE: Affected Geographic Sector
              </label>
              <div className="text-xs font-bold text-on-surface flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span>{alert.targetSector}</span>
                </div>
                <span className="font-mono text-[11px] text-outline">
                  Radius: {alert.threatRadiusMeters}m (+20km buffer)
                </span>
              </div>
            </div>

            {/* WHEN */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-outline">
                WHEN: Timestamp of Enforcement
              </label>
              <div className="font-mono text-xs font-bold text-error flex items-center gap-1.5 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/60">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{alert.timestamp} • ACTIVE ENFORCEMENT</span>
              </div>
            </div>

            {/* BY WHOM */}
            <div className="pt-1 border-t border-outline-variant/60 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-outline">Issued By Authority:</span>
              <span className="font-semibold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                {alert.authorizedBy}
              </span>
            </div>

            {/* Self-Closing Countdown Progress Bar */}
            <div className="pt-1 space-y-1">
              <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-error h-full transition-all duration-75 ease-linear"
                  style={{ width: `${fadeProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-outline font-mono">
                <span className="flex items-center gap-1 text-error font-semibold">
                  <span className="material-symbols-outlined text-xs">timer</span>
                  Self-closing notification
                </span>
                <span className="font-bold text-on-surface">{secondsRemaining}s</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              {onNavigateToShelter && (
                <button
                  className="flex-1 py-2.5 px-4 rounded-full bg-error text-on-error font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-error-container hover:text-on-error-container transition-all shadow-md active:scale-95"
                  onClick={() => {
                    onNavigateToShelter();
                    onClose();
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">directions_run</span>
                  <span>Navigate to Safe Transit Shelter</span>
                </button>
              )}
              <button
                className="py-2.5 px-5 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container font-heading font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                onClick={onClose}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Acknowledge &amp; Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // CASE 2: OUTSIDE 20KM RANGE AFTER IMPACT RADIUS (d > Impact Radius + 20km)
  // Pops on RIGHT TOP SIDE with CARD DESIGN and FADES AFTER 5 SECONDS
  // -------------------------------------------------------------------------
  return (
    <div
      className={`fixed top-20 right-5 z-50 max-w-sm w-full bg-surface-container-lowest border border-outline-variant/80 rounded-3xl p-4 shadow-2xl select-none space-y-3 ring-2 ring-primary/20 transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 translate-y-[-16px] pointer-events-none' : 'opacity-100 translate-y-0 animate-slideInRight'
      }`}
      id="advisory-top-right-toast"
    >
      {/* Toast Header with Close Cross */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">
            campaign
          </span>
          <div>
            <span className="text-[9px] font-mono tracking-wider uppercase text-outline block">
              GOV ADVISORY • OUTSIDE 20KM BUFFER
            </span>
            <h4 className="font-heading font-bold text-xs text-on-surface">
              {alert.orderType || 'Official Emergency Broadcast'}
            </h4>
          </div>
        </div>
        {/* Cross Icon */}
        <button
          className="p-1 rounded-full hover:bg-surface-container text-outline hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
          onClick={onClose}
          type="button"
          title="Dismiss Notice"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Body Details (WHAT, WHERE, WHEN) */}
      <div className="space-y-2 text-xs">
        {/* Distance Status */}
        <div className="flex items-center justify-between text-[11px] text-outline font-mono bg-surface-container p-2 rounded-xl">
          <span className="flex items-center gap-1 text-[#1b5e20] font-bold">
            <span className="material-symbols-outlined text-sm">shield</span>
            Safe Perimeter
          </span>
          <span className="font-bold text-on-surface">
            {(distanceMeters / 1000).toFixed(1)} km away (&gt;20km buffer)
          </span>
        </div>

        {/* 1. WHAT */}
        <div>
          <span className="text-outline font-bold text-[10px] block mb-0.5 uppercase tracking-wider">
            WHAT:
          </span>
          <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed bg-surface-container-low p-2 rounded-xl border border-outline-variant/50">
            {alert.directiveText}
          </p>
        </div>

        {/* 2. WHERE */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-outline font-bold uppercase text-[10px]">WHERE:</span>
          <span className="font-semibold text-on-surface">{alert.targetSector}</span>
        </div>

        {/* 3. WHEN */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-outline font-bold uppercase text-[10px]">WHEN:</span>
          <span className="font-mono text-on-surface font-semibold">{alert.timestamp}</span>
        </div>

        {/* 4. BY WHOM */}
        <div className="text-[10px] text-outline pt-1 border-t border-outline-variant/40 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-primary">verified</span>
          <span className="truncate">{alert.authorizedBy}</span>
        </div>

        {/* 5-Second Auto-Fade Indicator */}
        <div className="pt-1">
          <div className="w-full bg-outline-variant/30 h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-75 ease-linear"
              style={{ width: `${fadeProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-outline font-mono mt-1">
            <span>Auto-fading after 5s</span>
            <span>{secondsRemaining}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastAlertModal;
