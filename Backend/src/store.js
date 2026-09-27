import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { fixtures } from './fixtures.js';

// Keep route handlers independent of storage so local demos and PostGIS deployments share one API.
const schemaUrl = new URL('./schema.sql', import.meta.url);

function distanceMeters(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLng = radians(lng2 - lng1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createStore({ databaseUrl = process.env.DATABASE_URL } = {}) {
  let pool;
  let memory = structuredClone(fixtures);

  // A missing DATABASE_URL intentionally selects process-local demo data instead of blocking startup.
  if (databaseUrl) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
    await pool.query(await readFile(fileURLToPath(schemaUrl), 'utf8'));
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM app_records');
    if (rows[0].count === 0) {
      const insert = 'INSERT INTO app_records (collection, id, payload) VALUES ($1, $2, $3::jsonb) ON CONFLICT (collection, id) DO NOTHING';
      for (const [collection, records] of Object.entries(fixtures)) {
        for (const record of records) await pool.query(insert, [collection, record.id, JSON.stringify(record)]);
      }
    }
    memory = null;
  }

  return {
    mode: pool ? 'postgres' : 'memory',
    async list(collection) {
      if (pool) {
        const { rows } = await pool.query('SELECT payload FROM app_records WHERE collection = $1 ORDER BY created_at DESC', [collection]);
        return rows.map((row) => row.payload);
      }
      return structuredClone(memory[collection] ?? []);
    },
    async get(collection, id) {
      if (pool) {
        const { rows } = await pool.query('SELECT payload FROM app_records WHERE collection = $1 AND id = $2', [collection, id]);
        return rows[0]?.payload ?? null;
      }
      return structuredClone((memory[collection] ?? []).find((record) => record.id === id) ?? null);
    },
    async create(collection, data) {
      const record = { ...data, id: data.id ?? randomUUID(), createdAt: data.createdAt ?? new Date().toISOString() };
      if (pool) {
        await pool.query('INSERT INTO app_records (collection, id, payload) VALUES ($1, $2, $3::jsonb)', [collection, record.id, JSON.stringify(record)]);
      } else {
        memory[collection] ??= [];
        memory[collection].unshift(record);
      }
      return structuredClone(record);
    },
    async update(collection, id, changes) {
      if (pool) {
        const updatedAt = new Date().toISOString();
        const { rows } = await pool.query(
          'UPDATE app_records SET payload = payload || $3::jsonb || jsonb_build_object(\'updatedAt\', $4::text), updated_at = NOW() WHERE collection = $1 AND id = $2 RETURNING payload',
          [collection, id, JSON.stringify(changes), updatedAt],
        );
        return rows[0]?.payload ?? null;
      }
      const record = (memory[collection] ?? []).find((item) => item.id === id);
      if (!record) return null;
      Object.assign(record, changes, { updatedAt: new Date().toISOString() });
      return structuredClone(record);
    },
    async nearestShelter(latitude, longitude) {
      if (pool) {
        // Geography casts make the result a metre distance instead of a degree distance.
        const { rows } = await pool.query(
          `SELECT payload, ST_Distance(
             ST_SetSRID(ST_MakePoint((payload->>'longitude')::float8, (payload->>'latitude')::float8), 4326)::geography,
             ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
           ) AS distance_meters
           FROM app_records
           WHERE collection = 'shelters'
             AND (payload->>'totalBeds')::int > (payload->>'occupiedBeds')::int
           ORDER BY distance_meters ASC LIMIT 1`,
          [longitude, latitude],
        );
        return rows[0] ? { ...rows[0].payload, distanceMeters: Number(rows[0].distance_meters) } : null;
      }
      const shelters = memory.shelters.filter((item) => item.totalBeds > item.occupiedBeds);
      shelters.sort((a, b) => distanceMeters(latitude, longitude, a.latitude, a.longitude) - distanceMeters(latitude, longitude, b.latitude, b.longitude));
      const nearest = shelters[0];
      return nearest ? { ...structuredClone(nearest), distanceMeters: distanceMeters(latitude, longitude, nearest.latitude, nearest.longitude) } : null;
    },
    async nearbyIncidents(latitude, longitude, radiusMeters) {
      if (pool) {
        // Let PostGIS filter by radius in the database rather than loading every incident into Node.
        const { rows } = await pool.query(
          `SELECT payload, ST_Distance(
             ST_SetSRID(ST_MakePoint((payload->>'longitude')::float8, (payload->>'latitude')::float8), 4326)::geography,
             ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
           ) AS distance_meters
           FROM app_records
           WHERE collection = 'incidents'
             AND (payload->>'latitude') IS NOT NULL
             AND ST_DWithin(
               ST_SetSRID(ST_MakePoint((payload->>'longitude')::float8, (payload->>'latitude')::float8), 4326)::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3
             )
           ORDER BY distance_meters ASC`,
          [longitude, latitude, radiusMeters],
        );
        return rows.map((row) => ({ ...row.payload, distanceMeters: Number(row.distance_meters) }));
      }
      return memory.incidents
        .map((record) => ({ ...structuredClone(record), distanceMeters: distanceMeters(latitude, longitude, record.latitude, record.longitude) }))
        .filter((record) => record.distanceMeters <= radiusMeters)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    },
    async close() {
      await pool?.end();
    },
  };
}
