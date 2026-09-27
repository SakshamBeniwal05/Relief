import express from 'express';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
const port = Number(process.env.AI_ENGINE_PORT ?? 3100);
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'isolated-district-predictor', modelVersion: 'demo-rules-v1' });
});

app.post('/api/predict', (req, res) => {
  const { jobId, records } = req.body;
  if (typeof jobId !== 'string' || !Array.isArray(records) || records.length < 1) {
    return res.status(400).json({ error: 'jobId and at least one district record are required.' });
  }

  const predictions = records.map((record) => {
    const rainRisk = (record.rainfallMmh / 150) * 25;
    const saturationRisk = (record.soilSaturationPct / 100) * 25;
    const stabilityRisk = (Math.max(0, 1.5 - record.factorOfSafety) / 1.5) * 35;
    const tiltRisk = (Math.min(record.slopeTiltDeg, 5) / 5) * 15;
    const riskScore = Math.max(0, Math.min(100, Math.round(rainRisk + saturationRisk + stabilityRisk + tiltRisk)));
    const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 55 ? 'high' : riskScore >= 35 ? 'watch' : 'low';
    const factors = [
      record.rainfallMmh >= 80 && 'high rainfall',
      record.soilSaturationPct >= 85 && 'high soil saturation',
      record.factorOfSafety < 1 && 'factor of safety below 1.0',
      record.slopeTiltDeg >= 2.5 && 'elevated slope movement',
    ].filter(Boolean);
    return {
      district: record.district,
      station: record.station,
      riskScore,
      riskLevel,
      factors: factors.length ? factors : ['no threshold exceeded in demo rule set'],
    };
  });

  return res.json({ jobId, modelVersion: 'demo-rules-v1', predictions, completedAt: new Date().toISOString() });
});

app.post('/simulate-crash', (req, res) => {
  res.status(202).json({ status: 'crash_requested', service: 'isolated-district-predictor' });
  setTimeout(() => server.close(() => process.exit(1)), 50);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Isolated AI demo engine listening on http://127.0.0.1:${port}`);
});
