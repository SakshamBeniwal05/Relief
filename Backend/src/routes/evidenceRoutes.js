import express from 'express';
import { store } from '../data/store.js';
import { verifyIncidentEvidence } from '../ai/antiPrankPipeline.js';

const router = express.Router();

/**
 * GET /api/evidence
 */
router.get('/evidence', (req, res) => {
  res.json({
    status: 'success',
    count: store.incident_evidence.length,
    data: store.incident_evidence,
  });
});

/**
 * POST /api/evidence/verify
 * Anti-Prank Geo-Cam Pipeline Entry Point (Section 4.1)
 */
router.post('/evidence/verify', (req, res) => {
  const {
    targetSector = 'Chamoli Sector',
    observationNotes = '',
    photoUrl = '',
    browserCoords = { lat: 30.5512, lng: 79.5638 },
    exifCoords,
    capturedAtUtc,
  } = req.body;

  // Run the 3-tier Anti-Prank Pipeline
  const assessment = verifyIncidentEvidence({
    browserCoords,
    exifCoords,
    capturedAtUtc,
    fileUrl: photoUrl,
    observationNotes,
  });

  const evidenceId = `evid-${Date.now()}`;
  const incidentId = `inc-${Date.now()}`;

  const evidenceRecord = {
    id: evidenceId,
    incident_id: incidentId,
    file_url: photoUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    browser_coords: browserCoords,
    exif_coords: exifCoords || browserCoords,
    delta_distance_m: assessment.metrics.delta_distance_m,
    captured_at_utc: assessment.metrics.captured_at_utc,
    system_at_utc: assessment.metrics.system_at_utc,
    clock_drift_s: assessment.metrics.clock_drift_s,
    cv_confidence: assessment.metrics.cv_confidence,
    detected_features: assessment.metrics.detected_features,
    is_validated: assessment.is_validated,
    verdict: assessment.verdict,
  };

  store.incident_evidence.unshift(evidenceRecord);

  if (assessment.is_validated) {
    // Automatically register verified citizen incident
    const newIncident = {
      id: incidentId,
      code: `#UK-2024-${Date.now().toString().slice(-4)}`,
      type: observationNotes.toLowerCase().includes('flood') ? 'FLASH_FLOOD' : 'LANDSLIDE',
      title: `${targetSector} Citizen Sentry Report`,
      description: observationNotes || 'Citizen verified geo-cam evidence.',
      location_id: 'LOC-CHAM',
      location_text: targetSector,
      coordinates: browserCoords,
      severity: assessment.metrics.cv_confidence > 90 ? 'HIGH SEVERITY' : 'MEDIUM RISK',
      status: 'pending',
      time_ago: 'Just now',
      affected_roads: ['Corridor Under Observation'],
      photo_url: evidenceRecord.file_url,
      gps_delta: assessment.metrics.gps_delta_label,
      hardware_clock_status: assessment.metrics.clock_drift_label,
      cv_confidence: assessment.metrics.cv_confidence,
    };

    store.incidents.unshift(newIncident);

    // Audit Log Entry
    store.activity_logs.unshift({
      id: `log-${Date.now()}`,
      title: `Geo-Cam Verified: ${targetSector}`,
      authInfo: `Anti-Prank Pipeline • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
      description: `Hardware EXIF & CV confidence ${assessment.metrics.cv_confidence}% passed. Incident queued for tactical dispatch.`,
      icon: 'camera_indoor',
      iconBg: 'bg-surface-container-high',
      iconColor: 'text-primary',
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      status: 'success',
      passed: true,
      verdict: assessment.verdict,
      evidence: evidenceRecord,
      incident: newIncident,
    });
  }

  // If rejected by Anti-Prank Pipeline
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `Prank Submission Blocked: ${assessment.verdict}`,
    authInfo: `Anti-Prank Sentry • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: assessment.rejection_reasons.join(' '),
    icon: 'block',
    iconBg: 'bg-error-container',
    iconColor: 'text-error',
    timestamp: new Date().toISOString(),
  });

  return res.status(422).json({
    status: 'rejected',
    passed: false,
    verdict: assessment.verdict,
    reasons: assessment.rejection_reasons,
    metrics: assessment.metrics,
  });
});

export default router;
