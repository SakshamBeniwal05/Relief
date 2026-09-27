const hazard = (id, category, title, meta, desc, telemetry, directives, coordinates) => ({
  id,
  category,
  badgeClass: category.includes('CRITICAL') || category.includes('FLASH') ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container',
  title,
  meta,
  desc,
  telemetry,
  directives,
  img1: '',
  img2: '',
  coordinates,
});

export const fixtures = {
  hazards: [
    hazard('#UK-2024-JOS-09', 'CRITICAL • SECTION 144', 'Joshimath Ravigram Sector', 'Geotech Sensor Array #JOS-02', 'Severe subsurface subsidence. Inclinometer string #4 indicates active displacement of 14mm/24h. 14 residential units flagged red under Section 144.', { fos: '0.84 Crit', rain: '84 mm/h', sat: '92% High', pore: '412 kPa', tilt: '3.8° / 24h' }, 'Section 144 enforced. Civilians must immediately evacuate red-flagged structures to Gauchar Staging Hub via designated bypass.', { lat: 30.556, lng: 79.563 }),
    hazard('#UK-2024-ALAK-14', 'FLASH FLOOD VECTOR', 'Alaknanda Surge: Pipalkoti Hub', 'River Gauge Station #G-04', 'Discharge has surged to 1,024 m³/s past safe spillway limit. High-altitude glacial lake runoffs affecting low-lying riverbanks.', { fos: '1.02 Warn', rain: '112 mm/h', sat: '98% Sat', pore: '380 kPa', tilt: '0.9° / 24h' }, 'Clear all riverbed and flood-plain settlements. Riverside pilgrimage camps barred until water recedes.', { lat: 30.429, lng: 79.33 }),
    hazard('#UK-2024-NH58-214', 'HIGH SLIP RISK • ROAD SEVERED', 'Chamoli NH-58 Blockade Slip', 'Highway Logistics KM Post 214', 'Talus debris slide triggered by heavy monsoonal runoff. NH-58 closed to civilian traffic.', { fos: '0.78 Block', rain: '68 mm/h', sat: '88% Mod', pore: '340 kPa', tilt: '4.2° / 24h' }, 'Reroute all civilian convoys through Helang bypass. Heavy commercial transport halted at Rudraprayag barrier.', { lat: 30.512, lng: 79.521 }),
  ],
  incidents: [
    { id: 'inc-1', title: 'NH-7 Landslide Choke at Helang', severity: 'HIGH SEVERITY', locationText: 'Helang Bypass, KM Post 214', coordinates: '30.5512° N, 79.5638° E', latitude: 30.5512, longitude: 79.5638, timeAgo: '3 mins ago', photoUrl: '', gpsDelta: '1.4m (Hardware Match)', hardwareClockStatus: 'Synced (0.2s drift)', cvConfidence: 94.8, status: 'pending', description: 'Landslide debris reported near Helang.' },
    { id: 'inc-2', title: 'Pipalkoti Embankment Flash Rise', severity: 'MEDIUM RISK', locationText: 'Pipalkoti Ghat Embankment', coordinates: '30.4290° N, 79.3301° E', latitude: 30.429, longitude: 79.3301, timeAgo: '11 mins ago', photoUrl: '', gpsDelta: '3.1m (Tower Triangulated)', hardwareClockStatus: 'Nominal', cvConfidence: 88.2, status: 'pending', description: 'Rising water reported at Pipalkoti Ghat.' },
  ],
  volunteers: [
    { id: 'vol-1', name: 'Dr. Ananya Joshi', phone: '+91 98451 22891', govId: 'Aadhaar: •••• 8821', specialization: 'Paramedic / Trauma Specialist', specializationType: 'medical', sector: 'Joshimath Helipad Sector', availability: 'Immediate Dispatch Available', verificationBadge: 'DigiLocker Verified', status: 'pending' },
    { id: 'vol-2', name: 'Gurpreet S. Negi', phone: '+91 94120 77312', govId: 'Govt ID: DL-UK-2018', specialization: '4x4 Offroad Heavy Rescue', specializationType: 'vehicle', sector: 'Pipalkoti - Helang Corridor', availability: 'Equipped with winch & high clearance', verificationBadge: 'RTO Validated', status: 'pending' },
    { id: 'vol-3', name: 'Virendra Rawat (VU2ZUK)', phone: '+91 88710 44921', govId: 'WPC Lic: WPC-VU-91', specialization: 'Amateur Ham Radio Relayer', specializationType: 'radio', sector: 'Badrinath Pass Remote Node', availability: 'HF/VHF Portable Transceiver Rig', verificationBadge: 'DOT/WPC Cleared', status: 'pending' },
  ],
  shelters: [
    { id: 'shelter-gauchar', name: 'Gauchar Field Station Airstrip', district: 'Chamoli', latitude: 30.291, longitude: 79.155, totalBeds: 200, occupiedBeds: 142, medicalStaffCount: 12, waterReserveLiters: 12000, dryRationsDays: 7, contactPhone: '1070', guidelinesText: 'Registration counters active 24/7. Medical triage and dry ration kits on arrival.' },
    { id: 'shelter-pipalkoti', name: 'Pipalkoti Transit Hub', district: 'Chamoli', latitude: 30.429, longitude: 79.33, totalBeds: 300, occupiedBeds: 263, medicalStaffCount: 8, waterReserveLiters: 18000, dryRationsDays: 5, contactPhone: '1070', guidelinesText: 'Use the north entrance; keep the emergency access lane clear.' },
  ],
  habitations: [
    { id: 'hab-joshimath-red', name: 'Joshimath Ravigram', district: 'Chamoli', populationTotal: 824, householdsKutcha: 14, householdsPucca: 192, relocationPhase: 'IMMEDIATE_0_3M', priorityScore: 98, isCondemned: true, latitude: 30.556, longitude: 79.563 },
    { id: 'hab-sunil-ward', name: 'Sunil Ward Upper Terrace', district: 'Chamoli', populationTotal: 2100, householdsKutcha: 86, householdsPucca: 544, relocationPhase: 'SHORT_TERM_3_12M', priorityScore: 74, isCondemned: false, latitude: 30.56, longitude: 79.57 },
    { id: 'hab-pipalkoti-bank', name: 'Pipalkoti Riverbank', district: 'Chamoli', populationTotal: 540, householdsKutcha: 72, householdsPucca: 41, relocationPhase: 'MEDIUM_TERM_1_3Y', priorityScore: 61, isCondemned: false, latitude: 30.429, longitude: 79.33 },
  ],
  timelines: [
    { id: 'timeline-joshimath-2024', habitationId: 'hab-joshimath-red', gazetteNoticeTitle: 'Phase 1 DBT Ex-gratia Disbursement', administrativeOrderNo: 'UK-GOV-2024-88', surveyDeadline: '2026-10-12', grievanceOfficeLocation: 'Chamoli SDM Camp Office', requiredDocuments: ['Property deed', 'Khatoni land papers', 'Aadhaar verification', 'Loss assessment form'], nodalOfficerPhone: '1070', publishedAt: '2026-09-01T08:00:00.000Z' },
  ],
  directives: [
    { id: 'dir-1', orderType: 'Evacuation Notice', targetSector: 'Joshimath Ravigram Sector', directiveText: 'Section 144 enforced. Evacuate red-flagged structures to Gauchar Staging Hub.', pushBleMeshSiren: true, active: true, createdAt: '2026-09-27T08:00:00.000Z' },
    { id: 'dir-2', orderType: 'Road Closure', targetSector: 'NH-58 Helang Corridor', directiveText: 'NH-58 closed to civilian traffic. Use Helang bypass.', pushBleMeshSiren: false, active: true, createdAt: '2026-09-27T07:30:00.000Z' },
  ],
  activity: [
    { id: 'log-1', title: 'Sec 144 Imposed: Pipalkoti Buffer', authInfo: 'Authorized by Command Desk', description: 'Local alert directive active.', icon: 'emergency_share', iconBg: 'bg-error-container', iconColor: 'text-error', createdAt: '2026-09-27T08:00:00.000Z' },
    { id: 'log-2', title: '4x4 Fleet Mobilized to Helang', authInfo: 'Dispatch Desk', description: 'Verified volunteers assigned for fuel logistics.', icon: 'person_check', iconBg: 'bg-secondary-container', iconColor: 'text-primary', createdAt: '2026-09-27T07:45:00.000Z' },
  ],
  evidence: [],
  beacons: [],
  districtTelemetry: [
    { id: 'telemetry-chamoli', district: 'Chamoli', station: 'Joshimath slope array', rainfallMmh: 84, porePressureKpa: 412, soilSaturationPct: 92, slopeTiltDeg: 3.8, factorOfSafety: 0.84, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
    { id: 'telemetry-rudraprayag', district: 'Rudraprayag', station: 'Alaknanda river gauge', rainfallMmh: 112, porePressureKpa: 380, soilSaturationPct: 98, slopeTiltDeg: 0.9, factorOfSafety: 1.02, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
    { id: 'telemetry-uttarkashi', district: 'Uttarkashi', station: 'Bhatwari inclinometer', rainfallMmh: 76, porePressureKpa: 335, soilSaturationPct: 86, slopeTiltDeg: 2.7, factorOfSafety: 0.96, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
    { id: 'telemetry-pithoragarh', district: 'Pithoragarh', station: 'Munsiyari slope sensor', rainfallMmh: 48, porePressureKpa: 240, soilSaturationPct: 67, slopeTiltDeg: 1.4, factorOfSafety: 1.24, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
    { id: 'telemetry-tehri', district: 'Tehri Garhwal', station: 'New Tehri rain station', rainfallMmh: 35, porePressureKpa: 188, soilSaturationPct: 58, slopeTiltDeg: 0.7, factorOfSafety: 1.58, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
    { id: 'telemetry-bageshwar', district: 'Bageshwar', station: 'Kapkot river monitor', rainfallMmh: 91, porePressureKpa: 302, soilSaturationPct: 88, slopeTiltDeg: 2.2, factorOfSafety: 1.08, recordedAt: '2026-09-27T08:00:00.000Z', dataKind: 'synthetic demo data' },
  ],
};
