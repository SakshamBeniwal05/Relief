import express from 'express';
import cors from 'cors';
import http from 'http';
import { initWebSocketServer } from './src/services/websocketService.js';

// Import route modules
import hazardRoutes from './src/routes/hazardRoutes.js';
import incidentRoutes from './src/routes/incidentRoutes.js';
import shelterRoutes from './src/routes/shelterRoutes.js';
import habitationRoutes from './src/routes/habitationRoutes.js';
import timelineRoutes from './src/routes/timelineRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import evidenceRoutes from './src/routes/evidenceRoutes.js';
import volunteerRoutes from './src/routes/volunteerRoutes.js';
import directiveRoutes from './src/routes/directiveRoutes.js';
import sosRoutes from './src/routes/sosRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import liveDisasterRoutes from './src/routes/liveDisasterRoutes.js';
import riskZoningRoutes from './src/routes/riskZoningRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Production-Ready CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null;

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow server-to-server, curl, mobile apps, or same-origin requests with no origin header
    if (!origin) return callback(null, true);
    // 2. If explicit ALLOWED_ORIGINS whitelist is configured in env, strictly enforce it
    if (allowedOrigins && allowedOrigins.length > 0) {
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Rejected request from unlisted origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    }
    // 3. Default: Dynamically reflect requesting origin so credentials & web deployments (Vercel, Render, Netlify) work seamlessly
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'ETag'],
  maxAge: 86400, // 24-hour preflight cache to minimize browser roundtrips
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// System Status & Health Check
app.get('/', (req, res) => {
  res.json({
    system: 'SIH26191 Resilience Crisis Command Platform',
    version: '4.2.1',
    status: 'OPERATIONAL',
    jurisdiction: 'Uttarakhand State Disaster Management Authority (UK-SDMA) & NDRF',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      hazard_zones: '/api/hazard-zones',
      entities: '/api/entities',
      telemetry: '/api/telemetry',
      telemetry_predict: 'POST /api/telemetry/predict',
      incidents: '/api/incidents',
      shelters: '/api/shelters',
      shelters_nearest: '/api/shelters/nearest?lat=30.556&lng=79.563',
      habitations: '/api/habitations',
      timelines: '/api/timelines',
      reports: '/api/reports/:id',
      evidence_verify: 'POST /api/evidence/verify',
      volunteers: '/api/volunteers',
      directives: 'POST /api/directives',
      sos_broadcast: 'POST /api/sos/broadcast',
      admin_stats: '/api/admin/stats',
      admin_activity_logs: '/api/admin/activity-logs',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    ai_engine: 'JEV_GEOTECHNICAL_V3_ACTIVE',
    anti_prank_engine: 'CV_EXIF_CLOCK_TRIPLE_VERIFICATION_ACTIVE',
  });
});

// Mount Routes
app.use('/api', hazardRoutes);
app.use('/api', incidentRoutes);
app.use('/api', shelterRoutes);
app.use('/api', habitationRoutes);
app.use('/api', timelineRoutes);
app.use('/api', reportRoutes);
app.use('/api', evidenceRoutes);
app.use('/api', volunteerRoutes);
app.use('/api', directiveRoutes);
app.use('/api', sosRoutes);
app.use('/api', adminRoutes);
app.use('/api', liveDisasterRoutes);
app.use('/api', riskZoningRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.originalUrl} not found on SIH26191 Command Backend`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Command Server Exception',
    error: err.message,
  });
});

// Create HTTP Server & WebSocket Server
const server = http.createServer(app);
initWebSocketServer(server);

// Start Server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 SIH26191 Command Backend running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket Broadcast Gateway listening on ws://localhost:${PORT}`);
    console.log(`🛡️  AI Engines: JEV Geotechnical Model & Anti-Prank Pipeline Active`);
    console.log(`🛰️  PostGIS In-Memory Store: Ready for Uttarakhand Operations`);
    console.log('====================================================');
  });
}

export { server };
export default app;