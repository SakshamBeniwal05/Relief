/**
 * Live Natural Disasters & Dynamic Environmental Telemetry Router
 */

import { Router } from 'express';
import { getLiveDisasterFeeds } from '../services/liveDisasterService.js';

const router = Router();

/**
 * GET /api/disasters/live
 * Fetches real-time multi-hazard events (USGS Earthquakes, GloFAS Floods, GDACS Cyclones/Droughts, Open-Meteo Weather)
 */
router.get('/disasters/live', async (req, res) => {
  try {
    const data = await getLiveDisasterFeeds();
    res.json({
      status: 'success',
      data,
    });
  } catch (err) {
    console.error('Error fetching live disasters:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to aggregate real-time disaster feeds',
      error: err.message,
    });
  }
});

export default router;
