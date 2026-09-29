import express from 'express';
import { store } from '../data/store.js';

const router = express.Router();

/**
 * GET /api/admin/stats
 * Real-time Hero Stat Metrics for Admin Command Center
 */
router.get('/admin/stats', (req, res) => {
  const volunteerCount = store.volunteers.length;
  const pendingVolunteers = store.volunteers.filter((v) => v.status === 'pending').length;

  const pendingIncidentsCount = store.incidents.filter((i) => i.status === 'pending').length;

  // Compute live occupancy across all transit shelters
  let totalBeds = 0;
  let occupiedBeds = 0;
  for (const shelter of store.shelters) {
    totalBeds += shelter.total_beds;
    occupiedBeds += shelter.occupied_beds;
  }
  const occupancyPct = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '87.4';

  const sec144DirectivesCount = store.hazard_zones.filter((z) => z.is_sec144_active).length;

  const heroStats = [
    {
      title: 'Volunteer Applications',
      value: String(volunteerCount),
      badge: `${pendingVolunteers} Pending Review`,
      badgeType: pendingVolunteers > 0 ? 'error' : 'success',
      subtitle: 'Pending direct nodal interview & clearance',
      footerText: 'Medical & SAR priority',
      actionText: 'Review All',
      icon: 'badge',
    },
    {
      title: 'Geo-Cam Citizen Triage',
      value: String(pendingIncidentsCount),
      badge: 'Anti-Prank ON',
      badgeType: pendingIncidentsCount > 0 ? 'neutral' : 'success',
      subtitle: 'Hardware EXIF & CV validation required',
      footerText: 'Chamoli & Rudraprayag',
      actionText: 'Inspect EXIF',
      icon: 'camera_indoor',
    },
    {
      title: 'Transit Camps Occupancy',
      value: `${occupancyPct}%`,
      badge: Number(occupancyPct) > 85 ? 'Critical Saturation' : 'Optimal Capacity',
      badgeType: 'neutral',
      subtitle: 'Gauchar, Pipalkoti & Joshimath Hubs',
      footerText: `Capacity Cap ${totalBeds.toLocaleString()} cots`,
      actionText: 'Manage Beds',
      icon: 'cottage',
    },
    {
      title: 'Active Gazette Directives',
      value: String(sec144DirectivesCount),
      badge: 'Sec 144 Enforced',
      badgeType: 'error',
      subtitle: 'Alaknanda Basin buffer zones active',
      footerText: 'Next review 18:00 IST',
      actionText: 'Issue Directive',
      icon: 'gavel',
    },
  ];

  res.json({
    status: 'success',
    data: heroStats,
  });
});

/**
 * GET /api/admin/activity-logs
 */
router.get('/admin/activity-logs', (req, res) => {
  res.json({
    status: 'success',
    count: store.activity_logs.length,
    data: store.activity_logs,
  });
});

export default router;
