import express from 'express';
import { store } from '../data/store.js';
import { findNearestSafeShelters } from '../services/spatialEngine.js';

const router = express.Router();

/**
 * GET /api/shelters
 */
router.get('/shelters', (req, res) => {
  res.json({
    status: 'success',
    count: store.shelters.length,
    data: store.shelters,
  });
});

/**
 * GET /api/shelters/nearest
 * Query params: lat, lng, limit
 */
router.get('/shelters/nearest', (req, res) => {
  const { lat, lng, limit } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      status: 'error',
      message: 'Both lat and lng query parameters are required for nearest shelter query.',
    });
  }

  const nearest = findNearestSafeShelters(
    Number(lat),
    Number(lng),
    limit ? parseInt(limit, 10) : 5
  );

  res.json({
    status: 'success',
    user_coordinates: { lat: Number(lat), lng: Number(lng) },
    count: nearest.length,
    data: nearest,
  });
});

/**
 * PATCH /api/shelters/:id/capacity
 */
router.patch('/shelters/:id/capacity', (req, res) => {
  const { occupied_beds, total_beds } = req.body;
  const shelter = store.shelters.find((s) => s.id === req.params.id);

  if (!shelter) {
    return res.status(404).json({ status: 'error', message: 'Shelter not found' });
  }

  if (total_beds !== undefined) shelter.total_beds = Number(total_beds);
  if (occupied_beds !== undefined) shelter.occupied_beds = Number(occupied_beds);
  shelter.available_beds = Math.max(0, shelter.total_beds - shelter.occupied_beds);

  res.json({
    status: 'success',
    message: 'Shelter capacity updated',
    data: shelter,
  });
});

export default router;
