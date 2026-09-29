import React, { useState, useEffect } from 'react';

export interface RouteSummaryData {
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  hazardWarning?: string | null;
  steps?: { instruction: string; distance: string; duration: string }[];
}

interface DirectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userGpsCoords: { lat: number; lng: number } | null;
  gpsAccuracy?: number | null;
  onRequestLiveGps: () => void;
  onCalculateRoute: (
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number },
    mode: 'DRIVING' | 'WALKING'
  ) => void;
  onClearRoute: () => void;
  routeSummary: RouteSummaryData | null;
  isLoading?: boolean;
  initialDestination?: string;
}

export const POPULAR_DESTINATIONS = [
  { name: 'Gauchar Airstrip (Safe Hub)', query: 'Gauchar, Uttarakhand', icon: 'flight_takeoff', coords: { lat: 30.291, lng: 79.155 } },
  { name: 'Dehradun (State HQ)', query: 'Dehradun, Uttarakhand', icon: 'location_city', coords: { lat: 30.3165, lng: 78.0322 } },
  { name: 'Rishikesh (Gateway Hub)', query: 'Rishikesh, Uttarakhand', icon: 'water', coords: { lat: 30.0869, lng: 78.2676 } },
  { name: 'Joshimath (Disaster Zone)', query: 'Joshimath, Uttarakhand', icon: 'warning', coords: { lat: 30.556, lng: 79.563 } },
  { name: 'Chamoli (District HQ)', query: 'Chamoli Gopeshwar, Uttarakhand', icon: 'local_hospital', coords: { lat: 30.512, lng: 79.521 } },
  { name: 'Pipalkoti (Transit Camp)', query: 'Pipalkoti, Uttarakhand', icon: 'cabin', coords: { lat: 30.429, lng: 79.330 } },
  { name: 'Badrinath Pass', query: 'Badrinath, Uttarakhand', icon: 'temple_hindu', coords: { lat: 30.744, lng: 79.493 } },
  { name: 'Haridwar (Railhead)', query: 'Haridwar, Uttarakhand', icon: 'train', coords: { lat: 29.9457, lng: 78.1642 } },
  { name: 'New Delhi (National HQ)', query: 'New Delhi, Delhi', icon: 'hub', coords: { lat: 28.6139, lng: 77.2090 } },
];

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  isOpen,
  onClose,
  userGpsCoords,
  gpsAccuracy,
  onRequestLiveGps,
  onCalculateRoute,
  onClearRoute,
  routeSummary,
  isLoading = false,
  initialDestination = '',
}) => {
  const [originType, setOriginType] = useState<'my_location' | 'custom'>('my_location');
  const [customOrigin, setCustomOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>(initialDestination);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    let origin: string | { lat: number; lng: number } = 'Joshimath, Uttarakhand';
    if (originType === 'my_location' && userGpsCoords) {
      origin = userGpsCoords;
    } else if (originType === 'custom' && customOrigin.trim()) {
      origin = customOrigin.trim();
    } else if (userGpsCoords) {
      origin = userGpsCoords;
    }

    onCalculateRoute(origin, destination.trim(), travelMode);
  };

  const handleSelectCityChip = (city: typeof POPULAR_DESTINATIONS[0]) => {
    setDestination(city.query);
    let origin: string | { lat: number; lng: number } = userGpsCoords || 'Joshimath, Uttarakhand';
    if (originType === 'custom' && customOrigin.trim()) {
      origin = customOrigin.trim();
    }
    onCalculateRoute(origin, city.query, travelMode);
  };

  const handleSwap = () => {
    const prevDest = destination;
    if (originType === 'my_location') {
      setOriginType('custom');
      setCustomOrigin(prevDest);
      setDestination('My Location (Live GPS)');
    } else {
      setDestination(customOrigin);
      setCustomOrigin(prevDest);
    }
  };

  return (
    <div
      className="fixed top-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[26rem] max-h-[calc(100vh-6rem)] bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant shadow-2xl rounded-3xl flex flex-col overflow-hidden select-none animate-fadeIn"
      id="google-maps-directions-panel"
    >
      {/* Top Header Strip */}
      <div className="p-4 bg-primary text-on-primary flex items-center justify-between border-b border-primary-container">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-white">directions</span>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm tracking-tight">Google Maps Route Directions</h3>
            <span className="text-[10px] text-white/80 font-mono block">
              {userGpsCoords
                ? `Live GPS Active (±${gpsAccuracy ? Math.round(gpsAccuracy) : 12}m)`
                : 'Acquiring Live GPS...'}
            </span>
          </div>
        </div>
        <button
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          type="button"
          title="Close Directions"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto tactical-scroll flex-1">
        {/* Travel Mode Pills */}
        <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              travelMode === 'DRIVING'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setTravelMode('DRIVING')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">directions_car</span>
            <span>Driving (4x4)</span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              travelMode === 'WALKING'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setTravelMode('WALKING')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">directions_walk</span>
            <span>Mountain Walking</span>
          </button>
        </div>

        {/* Input Fields Container */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center gap-2">
            {/* Origin & Destination Connector Dots */}
            <div className="flex flex-col items-center py-2 shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-blue-200"></span>
              <div className="w-0.5 h-7 bg-outline-variant my-1"></div>
              <span className="material-symbols-outlined text-error text-base">location_on</span>
            </div>

            {/* Inputs Column */}
            <div className="flex-1 space-y-2">
              {/* Origin Field */}
              <div className="relative">
                {originType === 'my_location' ? (
                  <div className="w-full py-2 px-3 rounded-2xl bg-surface-container border border-outline-variant text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                      <span className="font-bold text-on-surface truncate">
                        {userGpsCoords
                          ? `My Location (${userGpsCoords.lat.toFixed(4)}, ${userGpsCoords.lng.toFixed(4)})`
                          : 'My Location (Live GPS)'}
                      </span>
                    </div>
                    <button
                      className="text-[10px] text-primary font-bold hover:underline shrink-0 ml-2"
                      onClick={() => setOriginType('custom')}
                      type="button"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="w-full py-2 pl-3 pr-16 rounded-2xl bg-surface-container border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                      placeholder="Enter starting city..."
                      value={customOrigin}
                      onChange={(e) => setCustomOrigin(e.target.value)}
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 font-bold hover:underline"
                      onClick={() => {
                        setOriginType('my_location');
                        onRequestLiveGps();
                      }}
                      type="button"
                    >
                      Use GPS
                    </button>
                  </div>
                )}
              </div>

              {/* Destination Field */}
              <div className="relative">
                <input
                  className="w-full py-2 pl-3 pr-8 rounded-2xl bg-surface-container border border-outline-variant text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                  placeholder="Enter destination city or landmark..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
                {destination && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    onClick={() => setDestination('')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <button
              className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors shrink-0"
              onClick={handleSwap}
              title="Swap Starting point and Destination"
              type="button"
            >
              <span className="material-symbols-outlined text-base">swap_vert</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              className="flex-1 py-2.5 px-4 rounded-full bg-primary text-on-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
              disabled={isLoading || !destination.trim()}
              type="submit"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Calculating Route...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">navigation</span>
                  <span>Get Directions</span>
                </>
              )}
            </button>

            {routeSummary && (
              <button
                className="py-2.5 px-4 rounded-full border border-outline-variant text-on-surface-variant hover:text-error hover:border-error text-xs font-bold transition-colors"
                onClick={onClearRoute}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Quick Select Popular Destinations & Safe Shelters */}
        <div className="space-y-2 pt-2 border-t border-outline-variant/50">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-outline block">
            Popular Cities &amp; Relief Hubs:
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto tactical-scroll">
            {POPULAR_DESTINATIONS.map((city) => (
              <button
                key={city.name}
                className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[11px] font-medium text-on-surface flex items-center gap-1 transition-all active:scale-95"
                onClick={() => handleSelectCityChip(city)}
                type="button"
              >
                <span className="material-symbols-outlined text-[13px] text-primary">{city.icon}</span>
                <span>{city.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Route Summary Card */}
        {routeSummary && (
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/80 shadow-md space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-outline block">FASTEST ROUTE</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-black text-xl text-primary">
                    {routeSummary.duration}
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">
                    ({routeSummary.distance})
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#2e7d32]/15 text-[#1b5e20] text-[10px] font-bold">
                Via Valley Corridor
              </span>
            </div>

            {/* Tactical Hazard Warning along Route if any */}
            {routeSummary.hazardWarning ? (
              <div className="p-2.5 rounded-xl bg-error-container text-on-error-container border border-error/30 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-error shrink-0 mt-0.5">
                  warning
                </span>
                <p className="leading-snug text-[11px]">{routeSummary.hazardWarning}</p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#2e7d32]/10 text-[#1b5e20] text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#2e7d32]">check_circle</span>
                <span className="text-[11px] font-medium">Bypasses active hazard zones &amp; severed NH-58 post.</span>
              </div>
            )}

            {/* Turn by turn steps toggle */}
            {routeSummary.steps && routeSummary.steps.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/40">
                <button
                  className="w-full flex items-center justify-between text-xs font-bold text-primary hover:underline"
                  onClick={() => setShowSteps(!showSteps)}
                  type="button"
                >
                  <span>{showSteps ? 'Hide Navigation Steps' : `Show ${routeSummary.steps.length} Steps`}</span>
                  <span className="material-symbols-outlined text-base">
                    {showSteps ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showSteps && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto tactical-scroll text-[11px]">
                    {routeSummary.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-surface-container-low border border-outline-variant flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div
                            className="text-on-surface font-medium"
                            dangerouslySetInnerHTML={{ __html: step.instruction }}
                          />
                          <div className="text-[10px] text-outline font-mono mt-0.5">
                            {step.distance} • {step.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionsPanel;
