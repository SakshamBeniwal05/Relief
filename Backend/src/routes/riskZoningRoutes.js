/**
 * Dynamic Risk Zoning & Relocation Score Router
 */

import express from 'express';
import { getDynamicRiskZoning, classifyRiskZone } from '../services/riskZoningService.js';

const router = express.Router();

/**
 * GET /api/risk-zones
 * Returns all dynamically classified 3-Zone areas (Red, Yellow, Green)
 * with real-time 0-100 risk score and action-based relocation protocols.
 */
router.get('/risk-zones', async (req, res) => {
  try {
    const data = await getDynamicRiskZoning();
    res.json({
      status: 'success',
      data,
    });
  } catch (err) {
    console.error('Error fetching dynamic risk zones:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to compute dynamic risk zones',
      error: err.message,
    });
  }
});

/**
 * POST /api/risk-zones/evaluate
 * Evaluates custom coordinate or parameter payload against the 3-Zone Classification Engine
 */
router.post('/risk-zones/evaluate', (req, res) => {
  const {
    factorOfSafety = 1.0,
    soilSaturationPct = 60,
    rainMmh = 0,
    porePressureKpa = 100,
    nearbyQuakeMag = 0,
    quakeDistanceKm = 9999,
    riverDischargeM3s = 80,
  } = req.body;

  const result = classifyRiskZone({
    factorOfSafety: Number(factorOfSafety),
    soilSaturationPct: Number(soilSaturationPct),
    rainMmh: Number(rainMmh),
    porePressureKpa: Number(porePressureKpa),
    nearbyQuakeMag: Number(nearbyQuakeMag),
    quakeDistanceKm: Number(quakeDistanceKm),
    riverDischargeM3s: Number(riverDischargeM3s),
  });

  res.json({
    status: 'success',
    evaluation: result,
  });
});

export default router;
