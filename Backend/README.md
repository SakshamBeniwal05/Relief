# Relief Backend

Express API and Socket.IO server for the SIH26191 disaster response dashboard. It provides seeded hazard, shelter, habitation, timeline, and admin queue data, plus volunteer intake, incident moderation, evidence checks, directives, and offline SOS synchronization.

## Run locally

```powershell
npm install
npm run dev
```

The server listens on `http://localhost:3000`. Without `DATABASE_URL`, seeded demo data is kept in memory and resets when the process restarts. Copy `.env.example` to `.env` and configure PostgreSQL with the PostGIS extension for database-backed mode. On startup, the service applies `src/schema.sql` and seeds `app_records` when it is empty. The relational PostGIS tables are included for spatial data; the current API demo records are stored as JSONB and use PostGIS geography expressions for nearby incident and nearest available shelter queries.

### Isolated Prediction Demo

Run the predictor in a second terminal from `Backend`:

```powershell
npm run dev:ai
```

It listens on `127.0.0.1:3100` by default. The admin dashboard reads the six synthetic district telemetry records from `GET /api/districts/telemetry`; `POST /api/ai/jobs` accepts a batch and immediately returns a queued job. The main API forwards the work asynchronously, records predictions or `engine_unavailable`, and continues serving its regular routes regardless of predictor health. Job/status routes are `GET /api/ai/status`, `GET /api/ai/jobs`, and `GET /api/ai/jobs/:id`.

The admin panel's **Crash AI Process (Demo)** button intentionally stops only the separate predictor. It is disabled by the API in production. Start the main API and predictor as separate processes; restarting one does not restart the other. This predictor uses a transparent demo rules baseline (`demo-rules-v1`), not a trained or validated AI model. Its output is for testing process isolation only and must not inform real emergency decisions.

Set `ADMIN_API_KEY` and send `Authorization: Bearer <key>` to admin endpoints. Admin routes are intentionally open only when no key is configured for local demo use; production startup refuses to run without a key. Restrict `FRONTEND_ORIGIN` when the service is deployed.

## Main API

All routes are under `/api`; successful collection responses use `{ "data": [...] }`.

- `GET /health`, `GET /hazards`, `GET /hazards/:id`
- `GET /incidents` (verified only), `GET /incidents/nearby?lat=&lng=&radius=`, `POST /incidents`
- `POST /incidents/:id/evidence` and `GET /incidents/:id/evidence`
- `POST /volunteers`
- `GET /admin/volunteers`, `PATCH /admin/volunteers/:id` (`approved`, `deployed`, `rejected`)
- `GET /admin/incidents`, `PATCH /admin/incidents/:id` (`verified`, `escalated`, `dismissed`)
- `GET /shelters`, `GET /shelters/:id`, `GET /routes/nearest-shelter?lat=&lng=`
- `GET /habitations`, `GET /timelines`, `GET /timelines/:id`
- `GET /directives`, `POST /admin/directives`, `GET /activity`
- `POST /sos/sync`, `GET /admin/sos`, `GET /admin/stats`

Evidence submissions must include a media URL, EXIF and browser coordinates, a UTC capture timestamp, and optional CV confidence. The API rejects GPS deltas of 300 metres or more and capture times more than 120 seconds from server time. The current UI does not yet upload camera bytes, so this endpoint validates submitted metadata but cannot independently prove that metadata came from the image; connect a server-side image/EXIF upload pipeline before relying on it operationally. Shelter directions are currently straight-line estimates, not road routes; use an OSRM/GraphHopper service for dispatch navigation.

Socket.IO clients are joined to `room-uttarakhand`, `room-alerts`, and `room-ble-mesh`. Events include `incident:created`, `incident:updated`, `evidence:created`, `volunteer:created`, `volunteer:updated`, `directive:created`, and `sos:received`.

Run the API tests with `npm test`.
