import express from 'express';
import { store } from '../data/store.js';
import { getDynamicRiskZoning } from '../services/riskZoningService.js';

const router = express.Router();

/**
 * GET /api/habitations
 * Mode 2 Resettlement Queues with Real-Time Risk Scores (0-100) and 3-Zone Classification
 */
router.get('/habitations', async (req, res) => {
  try {
    const riskData = await getDynamicRiskZoning();
    let data = riskData.habitations;

    const { priority, zone } = req.query;
    if (zone) {
      data = data.filter((h) => h.zone.toLowerCase() === zone.toLowerCase());
    }
    if (priority) {
      data = data.filter((h) => (h.urgency || '').toLowerCase().includes(priority.toLowerCase()));
    }

    res.json({
      status: 'success',
      count: data.length,
      zonesSummary: riskData.zonesSummary,
      liveDisasterContext: riskData.liveDisasterContext,
      data,
    });
  } catch (err) {
    res.json({
      status: 'success',
      count: store.habitations.length,
      data: store.habitations,
    });
  }
});

/**
 * GET /api/resettlement-sites
 * Carrying capacity analysis
 */
router.get('/resettlement-sites', (req, res) => {
  res.json({
    status: 'success',
    count: store.resettlement_sites.length,
    data: store.resettlement_sites,
  });
});

export default router;
