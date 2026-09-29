import express from 'express';
import { store } from '../data/store.js';

const router = express.Router();

/**
 * GET /api/volunteers
 */
router.get('/volunteers', (req, res) => {
  const { status, type } = req.query;
  let results = [...store.volunteers];

  if (status) {
    results = results.filter((v) => v.status === status);
  }
  if (type) {
    results = results.filter((v) => v.specializationType === type);
  }

  res.json({
    status: 'success',
    count: results.length,
    data: results,
  });
});

/**
 * POST /api/volunteers
 * Citizen volunteer application intake
 */
router.post('/volunteers', (req, res) => {
  const { fullName, mobile, specialization, notes } = req.body;

  if (!fullName || !mobile) {
    return res.status(400).json({
      status: 'error',
      message: 'Full name and mobile number are required.',
    });
  }

  // Derive specialization type heuristic
  const specLower = (specialization || '').toLowerCase();
  let specType = 'rescue';
  if (specLower.includes('medic') || specLower.includes('nurse') || specLower.includes('trauma')) {
    specType = 'medical';
  } else if (specLower.includes('4x4') || specLower.includes('driver') || specLower.includes('vehicle')) {
    specType = 'vehicle';
  } else if (specLower.includes('radio') || specLower.includes('ham') || specLower.includes('comm')) {
    specType = 'radio';
  }

  const newVolunteer = {
    id: `vol-${Date.now().toString().slice(-4)}`,
    name: fullName,
    phone: mobile,
    govId: `Aadhaar: •••• ${Math.floor(1000 + Math.random() * 9000)}`,
    specialization: specialization || 'General Search & Rescue Disaster Volunteer',
    specializationType: specType,
    sector: 'Chamoli Field Ops Command Hub',
    availability: notes || 'Immediate Deployment',
    verificationBadge: 'DigiLocker In Review',
    status: 'pending',
  };

  store.volunteers.unshift(newVolunteer);

  // Audit log entry
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `Volunteer Enrolled: ${fullName}`,
    authInfo: `Citizen Intake Desk • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: `Registered for [${specType.toUpperCase()}] operations. Mobile: ${mobile}.`,
    icon: 'person_add',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-primary',
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    status: 'success',
    message: 'Application submitted successfully. Under nodal verification.',
    data: newVolunteer,
  });
});

/**
 * PATCH /api/volunteers/:id
 * Admin updates volunteer status (approved, rejected, deployed)
 */
router.patch('/volunteers/:id', (req, res) => {
  const { status } = req.body;
  const index = store.volunteers.findIndex((v) => v.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Volunteer applicant not found' });
  }

  store.volunteers[index].status = status;
  if (status === 'approved') {
    store.volunteers[index].verificationBadge = 'DigiLocker Verified';
  }

  // Audit log entry
  store.activity_logs.unshift({
    id: `log-${Date.now()}`,
    title: `Volunteer ${store.volunteers[index].name}: ${status.toUpperCase()}`,
    authInfo: `Nodal Commander • ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
    description: `Applicant ${req.params.id} marked as ${status}. Deployment orders notified.`,
    icon: status === 'approved' ? 'check_circle' : 'cancel',
    iconBg: status === 'approved' ? 'bg-[#2e7d32]/20' : 'bg-error-container',
    iconColor: status === 'approved' ? 'text-[#1b5e20]' : 'text-error',
    timestamp: new Date().toISOString(),
  });

  res.json({
    status: 'success',
    message: `Volunteer status updated to ${status}`,
    data: store.volunteers[index],
  });
});

export default router;
