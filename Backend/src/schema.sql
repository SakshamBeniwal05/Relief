CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  district VARCHAR(64) NOT NULL,
  corridor VARCHAR(64) NOT NULL,
  location_type VARCHAR(32) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);

CREATE TABLE IF NOT EXISTS hazard_zones (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64) REFERENCES locations(id),
  hazard_type VARCHAR(32) NOT NULL,
  zone_level VARCHAR(32) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  risk_score INT CHECK (risk_score BETWEEN 0 AND 100),
  core_geometry GEOMETRY(Polygon, 4326),
  impact_radius_m FLOAT NOT NULL DEFAULT 500,
  source VARCHAR(32) DEFAULT 'DEMO_AI',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hazard_core ON hazard_zones USING GIST (core_geometry);

CREATE TABLE IF NOT EXISTS telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_node_id VARCHAR(64) NOT NULL,
  location_id VARCHAR(64) REFERENCES locations(id),
  rainfall_mmh FLOAT NOT NULL,
  pore_pressure_kpa FLOAT NOT NULL,
  soil_saturation_pct FLOAT NOT NULL,
  slope_tilt_deg FLOAT NOT NULL,
  factor_of_safety FLOAT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry_logs (recorded_at DESC);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) NOT NULL,
  affected_roads TEXT[] DEFAULT '{}',
  reporter_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'ACTIVE',
  verification_status VARCHAR(32) DEFAULT 'UNDER_VERIFICATION',
  confirmations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST (geom);

CREATE TABLE IF NOT EXISTS incident_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  exif_latitude DOUBLE PRECISION NOT NULL,
  exif_longitude DOUBLE PRECISION NOT NULL,
  captured_at_utc TIMESTAMPTZ NOT NULL,
  ai_filter_confidence FLOAT DEFAULT 0.0,
  is_validated BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habitations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  district VARCHAR(64) NOT NULL,
  population_total INT NOT NULL,
  households_kutcha INT NOT NULL,
  households_pucca INT NOT NULL,
  relocation_phase VARCHAR(32) NOT NULL,
  priority_score INT CHECK (priority_score BETWEEN 0 AND 100),
  is_condemned BOOLEAN DEFAULT FALSE,
  geom GEOMETRY(Polygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_habitations_geom ON habitations USING GIST (geom);

CREATE TABLE IF NOT EXISTS resettlement_sites (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  district VARCHAR(64) NOT NULL,
  total_buildable_area_ha FLOAT NOT NULL,
  max_population_capacity INT NOT NULL,
  allocated_population INT DEFAULT 0,
  water_discharge_lpcd FLOAT NOT NULL,
  bedrock_stability_fs FLOAT NOT NULL,
  slope_deg FLOAT NOT NULL,
  geom GEOMETRY(Polygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_resettlement_geom ON resettlement_sites USING GIST (geom);

CREATE TABLE IF NOT EXISTS shelters (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  total_beds INT NOT NULL,
  occupied_beds INT DEFAULT 0,
  medical_staff_count INT DEFAULT 0,
  water_reserve_liters INT DEFAULT 0,
  dry_rations_days INT DEFAULT 0,
  contact_phone VARCHAR(32) NOT NULL,
  guidelines_text TEXT,
  geom GEOMETRY(Point, 4326)
);
CREATE INDEX IF NOT EXISTS idx_shelters_geom ON shelters USING GIST (geom);

CREATE TABLE IF NOT EXISTS government_timelines (
  id VARCHAR(64) PRIMARY KEY,
  habitation_id VARCHAR(64) REFERENCES habitations(id),
  gazette_notice_title TEXT NOT NULL,
  administrative_order_no VARCHAR(128) NOT NULL,
  survey_deadline DATE NOT NULL,
  grievance_office_location TEXT NOT NULL,
  required_documents TEXT[] DEFAULT '{}',
  nodal_officer_phone VARCHAR(32) NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ble_mesh_beacons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_device_hash VARCHAR(64) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  payload_text VARCHAR(255) NOT NULL,
  hops_count INT DEFAULT 0,
  relayed_via_peer_hash VARCHAR(64),
  synced_to_server_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_records (
  collection VARCHAR(40) NOT NULL,
  id VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection, id)
);
CREATE INDEX IF NOT EXISTS idx_app_records_collection ON app_records (collection, created_at DESC);
