import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  UserNavbar,
  TacticalDrawer,
  DetailSidebar,
  RadarHudCard,
  MapControls,
  SosBlock,
  MapCanvas,
  MapSettingsModal,
  VolunteerApplicationModal,
  CreateReportModal,
  FullReportModal,
  DirectionsPanel,
  RehabilitationTimelineModal,
  USER_ENTITIES,
} from '../user';
import type {
  ModeType,
  HazardEntity,
  GoogleMapType,
  MapLayerSettings,
  RouteSummaryData,
  LiveDisasterEvent,
  DynamicRiskZoningData,
  ActiveRouteData,
} from '../user';
import {
  fetchHazardEntities,
  fetchLiveDisasters,
  fetchDynamicRiskZones,
  verifyGeoEvidence,
  submitVolunteerApplication,
  broadcastEmergencySos,
} from '../services/api';

export const UserMapHudPage: React.FC = () => {

  const [currentMode, setCurrentMode] = useState<ModeType>(1);
  const [entities, setEntities] = useState<Record<string, HazardEntity>>(USER_ENTITIES);

  // Real-Time Dynamic Risk Zoning (0-100 Score & 3-Zone Classification)
  const [dynamicRiskData, setDynamicRiskData] = useState<DynamicRiskZoningData | null>(null);

  // Live Browser GPS Tracking
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number }>({ lat: 30.556, lng: 79.563 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(12);
  const [gpsNotification, setGpsNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const gpsToastTimeoutRef = useRef<any>(null);

  const showGpsNotice = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (gpsToastTimeoutRef.current) clearTimeout(gpsToastTimeoutRef.current);
    setGpsNotification({ message, type });
    gpsToastTimeoutRef.current = setTimeout(() => {
      setGpsNotification(null);
    }, 4500);
  };

  // Google Maps Directions & Routing State
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState('');
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [activeRouteData, setActiveRouteData] = useState<ActiveRouteData | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummaryData | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Real-Time Multi-Disaster Live Feeds & Heatmap Rings
  const [liveDisasters, setLiveDisasters] = useState<LiveDisasterEvent[]>([]);

  // Government Rehabilitation Timeline & Physical Document Submission Modal
  const [isRehabilitationModalOpen, setIsRehabilitationModalOpen] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('joshimath');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<GoogleMapType>('roadmap');
  const [layers, setLayers] = useState<MapLayerSettings>({
    river: true,
    highway: true,
    evacRoute: true,
    pins: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number } | null>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    fetchHazardEntities().then((data) => {
      if (data && Object.keys(data).length > 0) {
        setEntities(data);
      }
    });

    fetchLiveDisasters().then((res) => {
      if (res?.disasters && res.disasters.length > 0) {
        setLiveDisasters(res.disasters);
      }
    });

    fetchDynamicRiskZones().then((res) => {
      if (res) {
        setDynamicRiskData(res);
      }
    });

    // Check URL search parameters for dynamic report permalink (e.g. ?report=joshimath)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reportParam = urlParams.get('report');
      if (reportParam) {
        const decoded = decodeURIComponent(reportParam);
        const matchedKey =
          Object.keys(USER_ENTITIES).find(
            (k) =>
              k.toLowerCase() === decoded.toLowerCase() ||
              USER_ENTITIES[k].id.toLowerCase() === decoded.toLowerCase()
          ) || decoded;
        setSelectedEntityKey(matchedKey);
        setIsReportModalOpen(true);
      }
    }

    // Request & watch live device GPS coordinates with fast caching and tolerant fallback
    let watchId: number | null = null;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserGpsCoords(coords);
          setGpsAccuracy(pos.coords.accuracy);
        },
        (err) => {
          console.info('Live GPS network fallback used:', err.message);
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserGpsCoords(coords);
          setGpsAccuracy(pos.coords.accuracy);
        },
        undefined,
        { enableHighAccuracy: false, maximumAge: 60000 }
      );
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handleRequestLiveGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      showGpsNotice('Geolocation not supported by device. Positioned at Himalayan Base.', 'warning');
      return;
    }

    showGpsNotice('Acquiring live GPS fix...', 'info');

    const applyFix = (pos: GeolocationPosition, label = 'GPS') => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserGpsCoords(coords);
      setGpsAccuracy(pos.coords.accuracy);
      mapInstanceRef.current?.panTo(coords);
      mapInstanceRef.current?.setZoom(14);
      showGpsNotice(`Live Location Locked (${label}, ±${Math.round(pos.coords.accuracy)}m)`, 'success');
    };

    // Tier 1: Fast network / cached fix (avoids timeout on PCs/laptops without satellite GPS)
    navigator.geolocation.getCurrentPosition(
      (pos) => applyFix(pos, 'Network/Wi-Fi'),
      () => {
        // Tier 2: Retry with high accuracy if first call timed out or was not cached
        navigator.geolocation.getCurrentPosition(
          (highPos) => applyFix(highPos, 'Hardware GPS'),
          (err) => {
            // Graceful fallback to default command base without intrusive browser alert
            const baseCoords = { lat: 30.556, lng: 79.563 };
            mapInstanceRef.current?.panTo(baseCoords);
            mapInstanceRef.current?.setZoom(13);
            showGpsNotice(
              `GPS notice: ${err.message}. Operating from Himalayan Command Base.`,
              'warning'
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
    );
  };

  // Directory of recognized locations and highway hubs
  const LOCATION_DIRECTORY: Record<string, { lat: number; lng: number; name: string }> = {
    joshimath: { lat: 30.556, lng: 79.563, name: 'Joshimath Ravigram Sector' },
    gauchar: { lat: 30.291, lng: 79.155, name: 'Gauchar Airstrip (Safe Hub)' },
    dehradun: { lat: 30.3165, lng: 78.0322, name: 'Dehradun State HQ' },
    rishikesh: { lat: 30.0869, lng: 78.2676, name: 'Rishikesh Gateway Hub' },
    chamoli: { lat: 30.512, lng: 79.521, name: 'Chamoli Gopeshwar District HQ' },
    pipalkoti: { lat: 30.429, lng: 79.330, name: 'Pipalkoti Transit Camp' },
    badrinath: { lat: 30.744, lng: 79.493, name: 'Badrinath Pass Remote Gateway' },
    haridwar: { lat: 29.9457, lng: 78.1642, name: 'Haridwar Railhead' },
    delhi: { lat: 28.6139, lng: 77.2090, name: 'New Delhi National HQ' },
    modinagar: { lat: 28.8318, lng: 77.5838, name: 'Modinagar' },
    muzaffarnagar: { lat: 29.4727, lng: 77.7085, name: 'Muzaffarnagar' },
    saharanpur: { lat: 29.9679, lng: 77.5452, name: 'Saharanpur' },
    sunil: { lat: 30.56, lng: 79.57, name: 'Sunil Ward Upper Terrace' },
    helang: { lat: 30.5512, lng: 79.5638, name: 'Helang Bypass' },
    karnal: { lat: 29.6857, lng: 76.9905, name: 'Karnal' },
    panipat: { lat: 29.3909, lng: 76.9635, name: 'Panipat' },
    meerut: { lat: 28.9845, lng: 77.7064, name: 'Meerut' },
    roorkee: { lat: 29.8543, lng: 77.8880, name: 'Roorkee' },
  };

  const resolveLocationCoords = (
    input: string | { lat: number; lng: number },
    defaultCoords: { lat: number; lng: number }
  ): { coords: { lat: number; lng: number }; label: string } => {
    if (typeof input === 'object' && input && typeof input.lat === 'number' && typeof input.lng === 'number') {
      return { coords: input, label: 'Selected Point (GPS)' };
    }
    const str = String(input || '').trim();
    const lower = str.toLowerCase();

    for (const [key, val] of Object.entries(LOCATION_DIRECTORY)) {
      if (lower.includes(key) || key.includes(lower)) {
        return { coords: { lat: val.lat, lng: val.lng }, label: val.name };
      }
    }

    const numMatch = str.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (numMatch) {
      const lat = parseFloat(numMatch[1]);
      const lng = parseFloat(numMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { coords: { lat, lng }, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
      }
    }

    return { coords: defaultCoords, label: str || 'Designated Base' };
  };

  const formatRouteDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) {
      return `${hours} hr ${remMins} min`;
    }
    return `${mins} min`;
  };

  const generateCurvedPath = (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    numPoints = 50
  ): Array<{ lat: number; lng: number }> => {
    const points: Array<{ lat: number; lng: number }> = [];
    const dLat = end.lat - start.lat;
    const dLng = end.lng - start.lng;
    const perpLat = -dLng * 0.12;
    const perpLng = dLat * 0.12;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const curve1 = Math.sin(t * Math.PI) * perpLat + Math.sin(t * 3 * Math.PI) * perpLat * 0.35;
      const curve2 = Math.sin(t * Math.PI) * perpLng + Math.sin(t * 3 * Math.PI) * perpLng * 0.35;
      points.push({
        lat: start.lat + dLat * t + curve1,
        lng: start.lng + dLng * t + curve2,
      });
    }
    return points;
  };

  const fetchOsrmRoute = async (
    origCoord: { lat: number; lng: number },
    destCoord: { lat: number; lng: number },
    startAddress: string,
    endAddress: string,
    mode: 'DRIVING' | 'WALKING',
    finalize: (routeData: ActiveRouteData, summaryData: RouteSummaryData) => void
  ) => {
    try {
      const osrmMode = mode === 'WALKING' ? 'walking' : 'driving';
      const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmMode}/${origCoord.lng},${origCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.length > 0) {
          const primary = json.routes[0];
          const rawCoords: [number, number][] = primary.geometry.coordinates;
          const coordinates = rawCoords.map((c) => ({ lat: c[1], lng: c[0] }));
          const midpoint = coordinates[Math.floor(coordinates.length / 2)] || {
            lat: (origCoord.lat + destCoord.lat) / 2,
            lng: (origCoord.lng + destCoord.lng) / 2,
          };

          const distanceKm = `${(primary.distance / 1000).toFixed(1)} km`;
          const durationStr = formatRouteDuration(primary.duration);

          let altCoordinates: Array<Array<{ lat: number; lng: number }>> | undefined = undefined;
          let altDistance: string | undefined = undefined;
          let altDuration: string | undefined = undefined;
          let altMidpoint: { lat: number; lng: number } | undefined = undefined;

          if (json.routes.length > 1) {
            const secondary = json.routes[1];
            const secCoords: [number, number][] = secondary.geometry.coordinates;
            altCoordinates = [secCoords.map((c) => ({ lat: c[1], lng: c[0] }))];
            altDistance = `${(secondary.distance / 1000).toFixed(1)} km`;
            altDuration = formatRouteDuration(secondary.duration);
            altMidpoint = altCoordinates[0][Math.floor(altCoordinates[0].length / 2)];
          }

          const steps = (primary.legs?.[0]?.steps || []).map((s: any) => ({
            instruction: s.maneuver?.type ? `${s.maneuver.type} onto ${s.name || 'highway'}` : s.name || 'Continue on road',
            distance: `${(s.distance / 1000).toFixed(1)} km`,
            duration: `${Math.round(s.duration / 60)} min`,
          }));

          const hasHazard =
            endAddress.toLowerCase().includes('joshimath') ||
            endAddress.toLowerCase().includes('chamoli') ||
            endAddress.toLowerCase().includes('km 214');

          const routeData: ActiveRouteData = {
            coordinates,
            alternativeCoordinates: altCoordinates,
            originCoord: origCoord,
            destCoord,
            distance: distanceKm,
            duration: durationStr,
            startAddress,
            endAddress,
            midpoint,
            mode,
            altDistance,
            altDuration,
            altMidpoint,
          };

          const summaryData: RouteSummaryData = {
            distance: distanceKm,
            duration: durationStr,
            startAddress,
            endAddress,
            hazardWarning: hasHazard
              ? 'Caution: Route passes near NH-58 KM 214 Talus Blockade. Rerouting civilian traffic via Helang Ridge Bypass.'
              : null,
            steps: steps.length > 0 ? steps : [
              { instruction: `Depart from ${startAddress}`, distance: '1.2 km', duration: '2 min' },
              { instruction: 'Follow designated arterial highway corridor', distance: distanceKm, duration: durationStr },
              { instruction: `Arrive safely at ${endAddress}`, distance: '0.5 km', duration: '1 min' },
            ],
          };

          finalize(routeData, summaryData);
          return;
        }
      }
    } catch (err) {
      console.info('[OSRM] Online routing query timed out. Generating topographical road spline...');
    }

    // 3. Resilient terrain curvature spline fallback
    const splinePoints = generateCurvedPath(origCoord, destCoord, 50);
    const dLat = destCoord.lat - origCoord.lat;
    const dLng = destCoord.lng - origCoord.lng;
    const approxDistKm = Math.max(8, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111 * 1.35));
    const approxDurationMins = mode === 'WALKING' ? Math.round(approxDistKm * 14) : Math.round(approxDistKm * 1.4);
    const durationStr = formatRouteDuration(approxDurationMins * 60);
    const distanceKm = `${approxDistKm} km`;
    const midpoint = splinePoints[Math.floor(splinePoints.length / 2)];

    const routeData: ActiveRouteData = {
      coordinates: splinePoints,
      originCoord: origCoord,
      destCoord,
      distance: distanceKm,
      duration: durationStr,
      startAddress,
      endAddress,
      midpoint,
      mode,
    };

    const summaryData: RouteSummaryData = {
      distance: distanceKm,
      duration: durationStr,
      startAddress,
      endAddress,
      steps: [
        { instruction: `Depart from ${startAddress}`, distance: '1.2 km', duration: '3 min' },
        { instruction: 'Continue along state highway corridor', distance: `${approxDistKm} km`, duration: durationStr },
        { instruction: `Arrive at ${endAddress}`, distance: '0.8 km', duration: '2 min' },
      ],
    };

    finalize(routeData, summaryData);
  };

  const handleCalculateRoute = async (
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number },
    mode: 'DRIVING' | 'WALKING'
  ) => {
    setIsRoutingLoading(true);

    const origResolved = resolveLocationCoords(origin, userGpsCoords || { lat: 30.556, lng: 79.563 });
    const destResolved = resolveLocationCoords(destination, { lat: 30.291, lng: 79.155 });
    const origCoord = origResolved.coords;
    const destCoord = destResolved.coords;
    const startAddress = origResolved.label;
    const endAddress = destResolved.label;

    const finalizeRoute = (routeData: ActiveRouteData, summaryData: RouteSummaryData) => {
      setActiveRouteData(routeData);
      setRouteSummary(summaryData);
      setIsRoutingLoading(false);

      if (mapInstanceRef.current && routeData.coordinates.length > 0) {
        try {
          const bounds = new window.google.maps.LatLngBounds();
          routeData.coordinates.forEach((pt) => bounds.extend(pt));
          mapInstanceRef.current.fitBounds(bounds, { top: 90, right: 380, bottom: 90, left: 90 });
        } catch (e) {
          // ignore
        }
      } else {
        setTargetCoords(routeData.midpoint);
      }
    };

    // 1. Try Google Maps DirectionsService if available
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      try {
        const directionsService = new window.google.maps.DirectionsService();
        const travelMode =
          mode === 'WALKING'
            ? window.google.maps.TravelMode.WALKING
            : window.google.maps.TravelMode.DRIVING;

        directionsService.route(
          {
            origin: origCoord,
            destination: destCoord,
            travelMode,
          },
          async (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result && result.routes?.length > 0) {
              setDirectionsResult(result);
              const route = result.routes[0];
              const leg = route.legs[0];
              const pathCoords = route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
              const midpoint = pathCoords[Math.floor(pathCoords.length / 2)] || {
                lat: (origCoord.lat + destCoord.lat) / 2,
                lng: (origCoord.lng + destCoord.lng) / 2,
              };

              const distanceText = leg.distance?.text || 'N/A';
              const durationText = leg.duration?.text || 'N/A';

              const hasHazard =
                endAddress.toLowerCase().includes('joshimath') ||
                endAddress.toLowerCase().includes('chamoli') ||
                endAddress.toLowerCase().includes('km 214');

              const routeData: ActiveRouteData = {
                coordinates: pathCoords,
                originCoord: origCoord,
                destCoord,
                distance: distanceText,
                duration: durationText,
                startAddress: leg.start_address || startAddress,
                endAddress: leg.end_address || endAddress,
                midpoint,
                mode,
              };

              const summaryData: RouteSummaryData = {
                distance: distanceText,
                duration: durationText,
                startAddress: leg.start_address || startAddress,
                endAddress: leg.end_address || endAddress,
                hazardWarning: hasHazard
                  ? 'Caution: Route passes near NH-58 KM 214 Talus Blockade. Rerouting civilian traffic via Helang Ridge Bypass.'
                  : null,
                steps: leg.steps.map((s) => ({
                  instruction: s.instructions,
                  distance: s.distance?.text || '',
                  duration: s.duration?.text || '',
                })),
              };

              finalizeRoute(routeData, summaryData);
              return;
            }

            // Google Directions failed or was rejected -> Fallback to OSRM high-precision road network
            await fetchOsrmRoute(origCoord, destCoord, startAddress, endAddress, mode, finalizeRoute);
          }
        );
        return;
      } catch (err) {
        console.warn('Google Directions API exception:', err);
      }
    }

    // 2. Direct OSRM query
    await fetchOsrmRoute(origCoord, destCoord, startAddress, endAddress, mode, finalizeRoute);
  };

  const handleClearRoute = () => {
    setDirectionsResult(null);
    setActiveRouteData(null);
    setRouteSummary(null);
    setDirectionsDestination('');
  };

  const liveEntity = liveDisasters.find((d) => d.id === selectedEntityKey);
  const liveHabMatch = dynamicRiskData?.habitations?.find(
    (h) => h.id === selectedEntityKey || (selectedEntityKey === 'alaknanda' && h.id === 'pipalkoti')
  );

  const rawEntity: HazardEntity = liveEntity
    ? {
        id: liveEntity.id,
        category: `${liveEntity.category} • ${liveEntity.severity}`,
        badgeClass: liveEntity.badgeClass,
        title: liveEntity.title,
        meta: liveEntity.source,
        desc: liveEntity.desc,
        riskScore: liveEntity.severity === 'CRITICAL' ? 88.5 : 55.0,
        zone: (liveEntity.severity === 'CRITICAL' ? 'RED' : 'YELLOW') as 'RED' | 'YELLOW' | 'GREEN',
        riskLevel: liveEntity.severity === 'CRITICAL' ? 'HIGH RISK' : 'MODERATE RISK',
        relocationPreparedness:
          liveEntity.severity === 'CRITICAL'
            ? 'Prepare for Immediate Relocation'
            : 'Prepare & Monitor',
        priorityRank: liveEntity.severity === 'CRITICAL' ? 1 : 2,
        actionProtocol: `Radial impact zone computed with highest concentration at (${liveEntity.coordinates.lat.toFixed(3)}° N, ${liveEntity.coordinates.lng.toFixed(3)}° E). Immediate perimeter cordon active.`,
        telemetry: {
          fos:
            typeof liveEntity.telemetry.fos === 'number'
              ? liveEntity.telemetry.fos.toFixed(2)
              : String(liveEntity.telemetry.fos),
          rain: liveEntity.telemetry.rain,
          sat: liveEntity.telemetry.sat,
          pore: liveEntity.telemetry.porePressure,
          tilt: liveEntity.telemetry.slopeTilt,
        },
        directives: `Live alert recorded by ${liveEntity.source}. Radial impact zone computed with highest concentration at coordinates (${liveEntity.coordinates.lat.toFixed(3)}° N, ${liveEntity.coordinates.lng.toFixed(3)}° E). Multi-tier concentric dispersion active.`,
        img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        coordinates: liveEntity.coordinates,
        coreRadiusMeters: liveEntity.coreRadiusMeters,
        impactRadiusMeters: liveEntity.impactRadiusMeters,
        concentricRings: liveEntity.concentricRings,
      }
    : liveHabMatch && !entities[selectedEntityKey]
    ? {
        id: `#HAB-${liveHabMatch.id.toUpperCase()}`,
        category: `${liveHabMatch.zone} ZONE • ${liveHabMatch.riskLevel} (${liveHabMatch.riskScore}/100)`,
        badgeClass: liveHabMatch.badgeClass,
        title: liveHabMatch.name,
        meta: `${liveHabMatch.district} • ${liveHabMatch.baseGeology}`,
        desc: `Dynamic Risk Score: ${liveHabMatch.riskScore}/100. ${liveHabMatch.actionProtocol}`,
        riskScore: liveHabMatch.riskScore,
        zone: liveHabMatch.zone,
        riskLevel: liveHabMatch.riskLevel,
        relocationPreparedness: liveHabMatch.relocationPreparedness,
        priorityRank: liveHabMatch.priorityRank,
        actionProtocol: liveHabMatch.actionProtocol,
        telemetry: {
          fos: `${liveHabMatch.liveTelemetry?.factorOfSafety?.toFixed(2) ?? '0.84'}`,
          rain: `${Math.round(liveHabMatch.liveTelemetry?.rainMmh ?? 0)} mm/h`,
          sat: `${Math.round(liveHabMatch.liveTelemetry?.soilSatPct ?? 60)}% Sat`,
          pore: `${Math.round(liveHabMatch.liveTelemetry?.porePressureKpa ?? 120)} kPa`,
          tilt: '1.2° / 24h',
        },
        directives: liveHabMatch.actionProtocol,
        img1: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        img2: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        coordinates: liveHabMatch.coordinates,
      }
    : entities[selectedEntityKey] || entities['joshimath'] || USER_ENTITIES['joshimath'];

  // Enrich with live dynamic risk attributes if matched
  const currentEntity: HazardEntity = {
    ...rawEntity,
    riskScore:
      rawEntity.riskScore ??
      liveHabMatch?.riskScore ??
      (rawEntity.category?.includes('CRITICAL') || rawEntity.category?.includes('HIGH')
        ? 74.8
        : rawEntity.category?.includes('SAFE')
        ? 18.0
        : 39.2),
    zone:
      rawEntity.zone ??
      liveHabMatch?.zone ??
      (rawEntity.category?.includes('CRITICAL') || rawEntity.category?.includes('HIGH')
        ? 'RED'
        : rawEntity.category?.includes('SAFE')
        ? 'GREEN'
        : 'YELLOW'),
    riskLevel:
      rawEntity.riskLevel ??
      liveHabMatch?.riskLevel ??
      (rawEntity.category?.includes('CRITICAL') || rawEntity.category?.includes('HIGH')
        ? 'HIGH RISK'
        : rawEntity.category?.includes('SAFE')
        ? 'LOW RISK'
        : 'MODERATE RISK'),
    relocationPreparedness:
      rawEntity.relocationPreparedness ??
      liveHabMatch?.relocationPreparedness ??
      (rawEntity.category?.includes('CRITICAL') || rawEntity.category?.includes('HIGH')
        ? 'Prepare for Immediate Relocation'
        : rawEntity.category?.includes('SAFE')
        ? 'Normal Monitoring'
        : 'Prepare & Monitor'),
    priorityRank:
      rawEntity.priorityRank ??
      liveHabMatch?.priorityRank ??
      (rawEntity.category?.includes('CRITICAL') || rawEntity.category?.includes('HIGH')
        ? 1
        : rawEntity.category?.includes('SAFE')
        ? 3
        : 2),
    actionProtocol: rawEntity.actionProtocol ?? liveHabMatch?.actionProtocol ?? rawEntity.directives,
  };

  const handleSelectEntity = (key: string) => {
    setSelectedEntityKey(key);
    setIsDetailsOpen(true);
    const liveMatch = liveDisasters.find((d) => d.id === key);
    if (liveMatch?.coordinates) {
      setTargetCoords(liveMatch.coordinates);
      mapInstanceRef.current?.panTo(liveMatch.coordinates);
      mapInstanceRef.current?.setZoom(9);
      return;
    }
    const habMatch = dynamicRiskData?.habitations?.find((h) => h.id === key);
    if (habMatch?.coordinates) {
      setTargetCoords(habMatch.coordinates);
      mapInstanceRef.current?.panTo(habMatch.coordinates);
      mapInstanceRef.current?.setZoom(13);
      return;
    }
    const entity = entities[key] || USER_ENTITIES[key];
    if (entity?.coordinates) {
      setTargetCoords(entity.coordinates);
      mapInstanceRef.current?.panTo(entity.coordinates);
      mapInstanceRef.current?.setZoom(13);
    }
  };

  const handleCanvasClick = () => {
    setIsDetailsOpen(false);
  };

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 11) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 11) - 1);
    }
  };

  const handleRecenterGPS = () => {
    handleRequestLiveGps();
  };

  const handleCenterOnEntity = () => {
    if (currentEntity?.coordinates) {
      mapInstanceRef.current?.panTo(currentEntity.coordinates);
      mapInstanceRef.current?.setZoom(14);
    }
  };

  const handleToggleLayer = (layer: keyof MapLayerSettings) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-surface text-on-surface font-sans">
      {/* Live GPS HUD Notification Toast */}
      {gpsNotification && (
        <div
          className={`fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-mono backdrop-blur-md border transition-all ${
            gpsNotification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
              : gpsNotification.type === 'warning'
              ? 'bg-zinc-900/95 text-amber-300 border-amber-500/40 shadow-black/60'
              : 'bg-zinc-900/95 text-sky-200 border-sky-500/40 shadow-black/60'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {gpsNotification.type === 'success'
              ? 'check_circle'
              : gpsNotification.type === 'warning'
              ? 'location_searching'
              : 'radar'}
          </span>
          <span className="font-semibold">{gpsNotification.message}</span>
          <button
            onClick={() => setGpsNotification(null)}
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity p-0.5"
            title="Dismiss"
            type="button"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* 1. Base Layer Google Map Canvas with Polylines & Live Markers */}
      <MapCanvas
        currentMode={currentMode}
        mapTypeId={currentMapType}
        layers={layers}
        onSelectEntity={handleSelectEntity}
        onCanvasClick={handleCanvasClick}
        onMapLoad={handleMapLoad}
        targetCoordinates={targetCoords}
        userGpsCoords={userGpsCoords}
        gpsAccuracy={gpsAccuracy}
        directionsResult={directionsResult}
        activeRoute={activeRouteData}
        liveDisasters={liveDisasters}
        dynamicRiskData={dynamicRiskData}
      />

      {/* 2. Floating Top HUD App Bar */}
      <UserNavbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onToggleRadar={() => setIsRadarOpen(!isRadarOpen)}
        onToggleDirections={() => setIsDirectionsOpen(!isDirectionsOpen)}
        onOpenRehabilitationModal={() => setIsRehabilitationModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenProfile={() => alert('NDRF Nodal Field Commander Profile')}
      />

      {/* 3. Floating Tactical Command Drawer (Left) */}
      <TacticalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentMode={currentMode}
        onSelectEntity={handleSelectEntity}
        onOpenVolunteerModal={() => setIsVolunteerModalOpen(true)}
        onOpenMapSettings={() => setIsMapSettingsOpen(true)}
        onOpenRehabilitationModal={() => setIsRehabilitationModalOpen(true)}
        liveDisasters={liveDisasters}
        dynamicRiskData={dynamicRiskData}
        userGpsCoords={userGpsCoords}
        gpsAccuracy={gpsAccuracy}
      />

      {/* 4. Secondary Floating Details Sidebar (Left: Adjacent when Drawer open, Primary when Drawer closed) */}
      <DetailSidebar
        entity={currentEntity}
        isOpen={isDetailsOpen}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onClose={() => setIsDetailsOpen(false)}
        onExpandReport={() => setIsReportModalOpen(true)}
        onCenterMap={handleCenterOnEntity}
        onOpenRehabilitationModal={() => setIsRehabilitationModalOpen(true)}
      />

      {/* 5. Floating Radar HUD Card (Right) */}
      <RadarHudCard
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />

      {/* 6. Floating Map Controls (Bottom Right) */}
      <div className="fixed bottom-20 right-5 z-40">
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRecenterGPS={handleRecenterGPS}
          onOpenMapSettings={() => setIsMapSettingsOpen(true)}
          onOpenDirections={() => setIsDirectionsOpen(!isDirectionsOpen)}
        />
      </div>

      {/* 7. Crisis SOS Trigger & Dispatch Drawer (Bottom Right) */}
      <SosBlock
        onSosBroadcast={() => {
          broadcastEmergencySos({
            latitude: currentEntity.coordinates?.lat || 30.556,
            longitude: currentEntity.coordinates?.lng || 79.563,
            payloadText: `CRISIS SOS: Immediate assistance required in ${currentEntity.title}`,
          });
        }}
      />

      {/* 8. Map Settings & Map View Selector Modal (Satellite, Terrain, Hybrid, Roadmap) */}
      <MapSettingsModal
        isOpen={isMapSettingsOpen}
        onClose={() => setIsMapSettingsOpen(false)}
        currentMapType={currentMapType}
        onSelectMapType={(type) => setCurrentMapType(type)}
        layers={layers}
        onToggleLayer={handleToggleLayer}
      />

      {/* 9. Full Incident Report Dossier Modal */}
      <FullReportModal
        entity={currentEntity}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onOpenCreateReport={() => setIsCreateReportOpen(true)}
        entityKey={selectedEntityKey}
      />

      {/* 10. Create Report / Geo-Cam Evidence Submission Modal */}
      <CreateReportModal
        isOpen={isCreateReportOpen}
        onClose={() => setIsCreateReportOpen(false)}
        defaultSector={currentEntity.title}
        onSubmitReport={(report) => {
          verifyGeoEvidence(
            report,
            currentEntity.coordinates || { lat: 30.556, lng: 79.563 }
          );
        }}
      />

      {/* 11. Volunteer Application Modal */}
      <VolunteerApplicationModal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
        onSubmitApplication={(appData) => {
          submitVolunteerApplication(appData);
        }}
      />



      {/* 13. Google Maps Emergency Route Directions Panel */}
      <DirectionsPanel
        isOpen={isDirectionsOpen}
        onClose={() => setIsDirectionsOpen(false)}
        userGpsCoords={userGpsCoords}
        gpsAccuracy={gpsAccuracy}
        onRequestLiveGps={handleRequestLiveGps}
        onCalculateRoute={handleCalculateRoute}
        onClearRoute={handleClearRoute}
        routeSummary={routeSummary}
        isLoading={isRoutingLoading}
        initialDestination={directionsDestination}
      />

      {/* 14. Government Rehabilitation Timeline & Physical Document Submission Modal */}
      <RehabilitationTimelineModal
        isOpen={isRehabilitationModalOpen}
        onClose={() => setIsRehabilitationModalOpen(false)}
      />
    </div>
  );
};

export default UserMapHudPage;
