"""
SIH26191 Technical Blueprint - Section 3.4
JEV Environmental Geotechnical Predictive Model (Python Implementation)

Formulation:
FS = [c' + (γ * z - u) * cos^2(θ) * tan(φ')] / [γ * z * sin(θ) * cos(θ)]
"""

import math
from typing import Dict, Any

DEFAULT_GEOTECH_PARAMS = {
    "cohesion_kpa": 15.0,        # c': Effective cohesion (kPa)
    "unit_weight_kn_m3": 19.0,   # γ: Unit soil weight (kN/m³)
    "failure_depth_m": 3.5,      # z: Depth to shear failure plane (m)
    "friction_angle_deg": 31.0,  # φ': Internal friction angle (deg)
}

def calculate_factor_of_safety(
    pore_pressure_kpa: float = 150.0,
    slope_tilt_deg: float = 32.0,
    cohesion: float = DEFAULT_GEOTECH_PARAMS["cohesion_kpa"],
    unit_weight: float = DEFAULT_GEOTECH_PARAMS["unit_weight_kn_m3"],
    failure_depth: float = DEFAULT_GEOTECH_PARAMS["failure_depth_m"],
    friction_angle: float = DEFAULT_GEOTECH_PARAMS["friction_angle_deg"]
) -> float:
    """Computes geotechnical Factor of Safety (FS) for infinite slope stability."""
    theta_rad = math.radians(slope_tilt_deg)
    phi_rad = math.radians(friction_angle)

    cos_theta = math.cos(theta_rad)
    sin_theta = math.sin(theta_rad)
    tan_phi = math.tan(phi_rad)

    gamma_z = unit_weight * failure_depth
    driving_force = gamma_z * sin_theta * cos_theta

    if driving_force <= 0:
        return 3.0

    effective_normal_stress = max(0.0, gamma_z - pore_pressure_kpa)
    resisting_force = cohesion + effective_normal_stress * (cos_theta ** 2) * tan_phi

    fos = resisting_force / driving_force
    return round(max(0.01, fos), 2)

def calculate_hazard_score(
    factor_of_safety: float,
    soil_saturation_pct: float = 50.0,
    rainfall_mmh: float = 10.0
) -> float:
    """Computes composite 0-100 hazard score."""
    bounded_fos = min(max(factor_of_safety, 0.0), 2.0)
    if bounded_fos <= 1.0:
        fos_comp = 40.0 + (1.0 - bounded_fos) * 25.0
    else:
        fos_comp = (2.0 - bounded_fos) * 40.0

    sat_comp = (min(soil_saturation_pct, 100.0) / 100.0) * 22.0
    rain_comp = (min(rainfall_mmh, 150.0) / 150.0) * 15.0

    total_score = min(100.0, max(0.0, fos_comp + sat_comp + rain_comp))
    return round(total_score, 1)

def evaluate_slope(telemetry: Dict[str, float]) -> Dict[str, Any]:
    """Evaluates telemetry payload and returns stability metrics."""
    pore = telemetry.get("pore_pressure_kpa", 150.0)
    tilt = telemetry.get("slope_tilt_deg", 32.0)
    rain = telemetry.get("rainfall_mmh", 10.0)
    sat = telemetry.get("soil_saturation_pct", 50.0)

    fos = calculate_factor_of_safety(pore, tilt)
    score = calculate_hazard_score(fos, sat, rain)

    if fos < 1.0 or score >= 80.0:
        tier = "CRITICAL"
        sec144 = True
    elif fos < 1.3 or score >= 60.0:
        tier = "WARNING"
        sec144 = False
    elif fos < 1.6 or score >= 40.0:
        tier = "ADVISORY"
        sec144 = False
    else:
        tier = "NOMINAL"
        sec144 = False

    return {
        "factor_of_safety": fos,
        "hazard_score": score,
        "alert_tier": tier,
        "section_144_recommended": sec144
    }

if __name__ == "__main__":
    test_case = {
        "pore_pressure_kpa": 412.0,
        "slope_tilt_deg": 38.0,
        "soil_saturation_pct": 92.0,
        "rainfall_mmh": 84.0
    }
    result = evaluate_slope(test_case)
    print("Geotech Slope Evaluation:", result)
