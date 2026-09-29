import express from 'express';
import { store } from '../data/store.js';

const router = express.Router();

/**
 * GET /api/timelines
 */
router.get('/timelines', (req, res) => {
  res.json({
    status: 'success',
    count: store.government_timelines.length,
    data: store.government_timelines,
  });
});

/**
 * GET /api/timelines/:id
 */
router.get('/timelines/:id', (req, res) => {
  const item = store.government_timelines.find(
    (t) => t.id === req.params.id || t.order_code === req.params.id
  );
  if (!item) {
    return res.status(404).json({ status: 'error', message: 'Timeline order not found' });
  }

  res.json({
    status: 'success',
    data: item,
  });
});

export default router;
