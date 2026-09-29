/**
 * SIH26191 Technical Blueprint - Section 3.4
 * JEV Environmental Geotechnical Predictive Model
 * 
 * Computes Factor of Safety (FS) for Himalayan infinite slope stability:
 * FS = [c' + (γ * z - u) * cos^2(θ) * tan(φ')] / [γ * z * sin(θ) * cos(θ)]
 * 
 * And derives the 0-100 Dynamic Hazard Score and Alert Tiers.
 */

// Geotechnical parameters calibrated for Chamoli/Joshimath colluvium & weathered gneiss
const DEFAULT_GEOTECH_PARAMS = {
  cohesion_kpa: 15.0, // c': Effective cohesion (kPa)
  unit_weight_kn_m3: 19.0, // γ: Unit soil weight (kN/m³)
  failure_depth_m: 3.5, // z: Depth to shear failure surface (m)
  friction_angle_deg: 31.0, // φ': Effective internal friction angle (deg)
};

/**
 * Calculates the Factor of Safety (FS) based on geotechnical parameters and environmental telemetry.
 * 
 * @param {Object} input
 * @param {number} input.porePressure - u: Pore water pressure in kPa
 * @param {number} input.slopeTilt - θ: Slope angle in degrees
 * @param {number} [input.rainfall] - Rain intensity mm/h (influences pore pressure rate)
 * @param {number} [input.cohesion] - c' (optional override)
 * @param {number} [input.unitWeight] - γ (optional override)
 * @param {number} [input.failureDepth] - z (optional override)
 * @param {number} [input.frictionAngle] - φ' (optional override)
 * @returns {number} Factor of Safety
 */
export function calculateFactorOfSafety({
  porePressure = 150.0,
  slopeTilt = 32.0,
  cohesion = DEFAULT_GEOTECH_PARAMS.cohesion_kpa,
  unitWeight = DEFAULT_GEOTECH_PARAMS.unit_weight_kn_m3,
  failureDepth = DEFAULT_GEOTECH_PARAMS.failure_depth_m,
  frictionAngle = DEFAULT_GEOTECH_PARAMS.friction_angle_deg,
}) {
  const thetaRad = (slopeTilt * Math.PI) / 180.0;
  const phiRad = (frictionAngle * Math.PI) / 180.0;

  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  const tanPhi = Math.tan(phiRad);

  const gammaZ = unitWeight * failureDepth;

  // Driving force: shear stress along failure plane
  const drivingForce = gammaZ * sinTheta * cosTheta;

  // Resisting force: Mohr-Coulomb shear strength with effective normal stress
  const effectiveNormalStress = Math.max(0, gammaZ - porePressure);
  const resistingForce = cohesion + effectiveNormalStress * Math.pow(cosTheta, 2) * tanPhi;

  if (drivingForce <= 0) return 3.0; // Flat terrain or negative slope

  const fos = resistingForce / drivingForce;
  return Number(Math.max(0.01, fos).toFixed(2));
}

/**
 * Derives the Dynamic Hazard Score (0 - 100) from Factor of Safety,
 * soil saturation percentage, and precipitation intensity.
 */
export function calculateHazardScore({
  factorOfSafety,
  soilSaturation = 50.0,
  rainfallMmh = 10.0,
}) {
  const boundedFos = Math.min(Math.max(factorOfSafety, 0.0), 2.0);
  
  // Fos component: 0 to 65 points with sharp escalation in sub-unity failure regimes (FS < 1.0)
  let fosComponent;
  if (boundedFos <= 1.0) {
    fosComponent = 40.0 + (1.0 - boundedFos) * 25.0;
  } else {
    fosComponent = (2.0 - boundedFos) * 40.0;
  }

  // Saturation component: 0 to 22 points
  const satComponent = (Math.min(soilSaturation, 100.0) / 100.0) * 22.0;

  // Rainfall component: 0 to 15 points (saturation at 150 mm/h cloudburst)
  const rainComponent = (Math.min(rainfallMmh, 150.0) / 150.0) * 15.0;

  const totalScore = Math.min(100.0, Math.max(0.0, fosComponent + satComponent + rainComponent));
  return Number(totalScore.toFixed(1));
}

/**
 * Maps Factor of Safety and Hazard Score to alert level and operational action.
 */
export function getAlertTier(factorOfSafety, hazardScore) {
  if (factorOfSafety < 1.0 || hazardScore >= 80.0) {
    return {
      alertLevel: 'CRITICAL',
      badgeClass: 'bg-error-container text-on-error-container',
      sec144Enforceable: true,
      recommendation:
        'Immediate evacuation of red-flagged dwellings. Enforce Section 144 movement curfew and divert highway corridors.',
    };
  }

  if (factorOfSafety < 1.3 || hazardScore >= 60.0) {
    return {
      alertLevel: 'WARNING',
      badgeClass: 'bg-tertiary-container text-on-tertiary-container',
      sec144Enforceable: false,
      recommendation:
        'Pre-emptive buffer alert. Standby SAR quick response teams and prepare transit shelter capacity.',
    };
  }

  if (factorOfSafety < 1.6 || hazardScore >= 40.0) {
    return {
      alertLevel: 'ADVISORY',
      badgeClass: 'bg-secondary-container text-primary',
      sec144Enforceable: false,
      recommendation:
        'Heightened monitoring. Real-time telemetry sampling interval reduced from 15 mins to 2 mins.',
    };
  }

  return {
    alertLevel: 'NOMINAL',
    badgeClass: 'bg-[#2e7d32]/20 text-[#1b5e20]',
    sec144Enforceable: false,
    recommendation: 'Terrain conditions stable. Routine telemetry cycle active.',
  };
}

/**
 * Comprehensive analysis function for incoming telemetry.
 */
export function evaluateSlopeStability(telemetry) {
  const fos = calculateFactorOfSafety({
    porePressure: telemetry.pore_pressure_kpa,
    slopeTilt: telemetry.slope_tilt_deg,
    rainfall: telemetry.rainfall_mmh,
  });

  const hazardScore = calculateHazardScore({
    factorOfSafety: fos,
    soilSaturation: telemetry.soil_saturation_pct,
    rainfallMmh: telemetry.rainfall_mmh,
  });

  const alertTier = getAlertTier(fos, hazardScore);

  return {
    factor_of_safety: fos,
    hazard_score: hazardScore,
    ...alertTier,
    timestamp: new Date().toISOString(),
  };
}
