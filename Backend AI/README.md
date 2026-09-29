# SIH26191 - Backend AI Service Documentation

This module contains the AI engines and hydrological telemetry integrations specified in the **Resilience & Crisis Command Platform Technical Blueprint (SIH26191)**.

---

## 1. JEV Environmental Geotechnical Predictive Model (`jev_model.py` / `Backend/src/ai/jevModel.js`)

Realizes Section 3.4 of the Blueprint.

### Geotechnical Slope Stability Equation:
$$FS = \frac{c' + (\gamma \cdot z - u) \cos^2\theta \tan\phi'}{\gamma \cdot z \sin\theta \cos\theta}$$

Where:
- $c'$: Effective soil cohesion ($15.0 \text{ kPa}$ calibrated for Himalayan colluvium)
- $\gamma$: Unit soil weight ($19.0 \text{ kN/m}^3$)
- $z$: Depth of potential shear failure plane ($3.5 \text{ m}$)
- $u$: Pore water pressure ($\text{kPa}$)
- $\theta$: Slope inclination angle (degrees)
- $\phi'$: Internal friction angle ($31^\circ$)

### Dynamic Hazard Score (0–100):
$$HazardScore = \min\left(100, \max\left(0, (1 - \min(FS, 2.0)/2.0) \times 60 + (S_{soil}/100) \times 25 + (I_{rain}/150) \times 15\right)\right)$$

### Alert Tiers:
- $FS < 1.0$ or Score $\ge 80$: **CRITICAL** (Core Red Zone • Section 144 Enforcement)
- $1.0 \le FS < 1.3$ or Score $\ge 60$: **WARNING** (Buffer Impact Zone • Pre-emptive Watch)
- $1.3 \le FS < 1.6$ or Score $\ge 40$: **ADVISORY** (Yellow Watch)
- Otherwise: **NOMINAL** (Safe Terrain)

---

## 2. Anti-Prank Field Verification Pipeline (`anti_prank_pipeline.py` / `Backend/src/ai/antiPrankPipeline.js`)

Realizes Section 4.1 of the Blueprint.

1. **Distance Delta Check**:
   $$\Delta d = \text{Haversine}(\text{Browser GPS}, \text{EXIF GPS}) < 300\text{m}$$
   *Failure Trigger*: `SPOOFED_LOCATION_PRANK`
2. **Clock Drift Check**:
   $$\Delta t = |\text{Server UTC} - \text{EXIF UTC}| < 120\text{s}$$
   *Failure Trigger*: `HISTORICAL_REPOST`
3. **Computer Vision Debris & Flood Classifier**:
   - Classifies presence of landslide debris, talus rockfall, mud slick, or turbid flash water surge.
   - Evaluates confidence score against the $70\%$ threshold.

---

## 3. Hydrological Telemetry Portal Ingestion (`water_portal_client.py`)

Interacts with the **National Water Informatics Centre (NWIC)** and Central Water Commission (CWC) open data repository:
- Resource ID: `43e4e098-065f-4288-a226-3ea1993a80e7`
- Districts: Chamoli, Bageshwar, Pithoragarh, Tehri Garhwal, Uttarkashi.
