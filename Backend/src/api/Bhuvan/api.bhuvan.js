/**
 * ISRO Bhuvan Geospatial Services Client / Adapter
 * Provides WMS/WFS layer endpoints and geospatial data proxies for
 * Uttarakhand disaster risk management and flood hazard zonation.
 */

export const BHUVAN_ENDPOINTS = {
  WMS_BASE: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms',
  DISASTER_SERVICES: 'https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php',
  LANDSLIDE_HAZARD_LAYER: 'landslide:uk_hazard_zonation',
  FLOOD_INUNDATION_LAYER: 'flood:alaknanda_basin_inundation',
};

/**
 * Returns Bhuvan WMS configuration tile parameters for Google Maps / Leaflet overlays.
 */
export function getBhuvanTileConfig(layerName = 'LANDSLIDE_HAZARD_LAYER') {
  const layer = BHUVAN_ENDPOINTS[layerName] || BHUVAN_ENDPOINTS.LANDSLIDE_HAZARD_LAYER;
  return {
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: layer,
    styles: '',
    format: 'image/png',
    transparent: true,
    srs: 'EPSG:4326',
    bbox: '78.5,29.5,80.5,31.5', // Uttarakhand bounding box
  };
}

/**
 * Mock query for Bhuvan satellite landslide susceptibility index
 */
export async function queryBhuvanSusceptibility(lat, lng) {
  return {
    source: 'ISRO_BHUVAN_NRSC',
    coordinates: { lat, lng },
    susceptibility_class: lat > 30.5 ? 'Very High (Zone V)' : 'Moderate (Zone IV)',
    lithology: 'Quartzite and Mica Schist colluvium',
    slope_stability_factor: lat > 30.5 ? 0.85 : 1.45,
    timestamp: new Date().toISOString(),
  };
}
