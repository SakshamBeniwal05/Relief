/**
 * SIH26191 Technical Blueprint - Section 4.4 Spatial Computing Engine
 * Implements PostGIS-equivalent geofencing, Haversine distance routing,
 * and nearest available shelter discovery.
 */

import { store } from '../data/store.js';

const EARTH_RADIUS_KM = 6371.0;

/**
 * Computes Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes Haversine distance in meters.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  return calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000.0;
}

/**
 * Finds the nearest operational shelter with available bed capacity.
 * Blueprint Section 4.4:
 * SELECT id, name, available_beds, ST_Distance(geom, ST_SetSRID(ST_Point(lon, lat), 4326))
 * WHERE available_beds > 0 AND status = 'operational'
 * ORDER BY distance ASC LIMIT 5;
 */
export function findNearestSafeShelters(userLat, userLng, limit = 5) {
  const availableShelters = store.shelters.filter(
    (s) => s.available_beds > 0 && s.status === 'operational'
  );

  const scored = availableShelters.map((shelter) => {
    const distKm = calculateDistanceKm(
      userLat,
      userLng,
      shelter.coordinates.lat,
      shelter.coordinates.lng
    );

    // Approximate mountain trekking time: 3.2 km/h average with slope factors
    const estimatedMinutes = Math.round((distKm / 3.2) * 60);

    return {
      ...shelter,
      distance_km: Number(distKm.toFixed(2)),
      estimated_transit_time_minutes: estimatedMinutes,
    };
  });

  scored.sort((a, b) => a.distance_km - b.distance_km);
  return scored.slice(0, limit);
}

/**
 * ST_DWithin: Searches incidents within a specified radius (km).
 */
export function getIncidentsWithinRadius(userLat, userLng, radiusKm = 25.0) {
  return store.incidents
    .map((incident) => {
      const distKm = calculateDistanceKm(
        userLat,
        userLng,
        incident.coordinates.lat,
        incident.coordinates.lng
      );
      return {
        ...incident,
        distance_km: Number(distKm.toFixed(2)),
      };
    })
    .filter((inc) => inc.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Checks if a point lies within any dual-concentric hazard zone (Core or Buffer).
 */
export function evaluatePointHazardStatus(userLat, userLng) {
  for (const zone of store.hazard_zones) {
    const distMeters = calculateDistanceMeters(
      userLat,
      userLng,
      zone.centroid.lat,
      zone.centroid.lng
    );

    if (distMeters <= zone.core_radius_m) {
      return {
        status: 'INSIDE_CORE_HAZARD',
        zone_id: zone.id,
        zone_code: zone.zone_code,
        risk_level: 'CRITICAL',
        distance_meters: Math.round(distMeters),
        is_sec144_active: zone.is_sec144_active,
        directives: zone.directives,
      };
    }

    if (distMeters <= zone.buffer_radius_m) {
      return {
        status: 'INSIDE_BUFFER_ZONE',
        zone_id: zone.id,
        zone_code: zone.zone_code,
        risk_level: 'WARNING',
        distance_meters: Math.round(distMeters),
        is_sec144_active: zone.is_sec144_active,
        directives: zone.directives,
      };
    }
  }

  return {
    status: 'SAFE_PERIMETER',
    risk_level: 'NOMINAL',
    distance_meters: null,
    is_sec144_active: false,
    directives: 'Normal movement permitted. Follow standard advisories.',
  };
}
