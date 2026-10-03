# 🏔️ Relief — Resilience & Crisis Command Platform

> **Smart India Hackathon (SIH 2026) | Problem ID: SIH26191**  
> An AI-powered, real-time crisis command and disaster management platform engineered for Himalayan landslide early warning, geotechnical risk triage, and rapid emergency dispatch.

---

## 📋 Table of Contents
1. [About the Project](#-about-the-project)
2. [System Architecture](#-system-architecture)
3. [Key Features](#-key-features)
4. [Technology Stack](#-technology-stack)
5. [Data Models & Mathematical Engines](#-data-models--mathematical-engines)
6. [Repository Structure](#-repository-structure)
7. [Environment Variables](#-environment-variables)
8. [Setup & Local Development](#-setup--local-development)
9. [Contributing](#-contributing)

---

## 🌟 About the Project

In fragile high-altitude terrains like Uttarakhand, landslides and flash floods cause catastrophic disruptions with minimal warning. Traditional alert systems often suffer from delayed telemetry, unverified ground reports, and lack of spatial coordination.

**Relief** solves this with an end-to-end resilience infrastructure:
- **Predictive Slope Stability Modeling**: Automatically calculates soil factor-of-safety ($FS$) and dynamic hazard scores from pore pressure and rainfall data.
- **Anti-Prank Field Verification**: Filters false emergency reports by cross-validating device GPS against embedded EXIF metadata and server clock drift.
- **Real-Time Command Dispatch**: Leverages WebSockets to push instant hazard level changes, field reports, and rescue routing to emergency operators and public map HUDs.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                      CLIENT LAYER                                       |
|                                                                                         |
|   [ Public Map HUD (React + Leaflet/Maps) ]     [ Admin Incident Triage & Dispatch HUD] |
+-----------------------------------------------------------------------------------------+
                                 │                                    ▲
               HTTP Requests     │                                    │  WebSockets (ws)
               (Report Incident) │                                    │  (Instant Alerts)
                                 ▼                                    │
+-----------------------------------------------------------------------------------------+
|                                EXPRESS BACKEND SERVER (Node.js)                         |
|                                                                                         |
|   ├── Incident Ingestion Router     ├── WebSocket Broadcast Hub                         |
|   ├── Haversine Verification API    └── Telemetry Dispatch Services                     |
+-----------------------------------------------------------------------------------------+
                    │                                            │
                    ▼                                            ▼
+---------------------------------------+    +--------------------------------------------+
|         AI PREDICTIVE SERVICE         |    |         HYDROLOGICAL TELEMETRY             |
|                (Python)               |    |                  (NWIC)                    |
|                                       |    |                                            |
|  ├── JEV Geotechnical Model           |    |  ├── National Water Informatics Centre     |
|  ├── Dynamic Hazard Scoring           |    |  ├── Central Water Commission (CWC)        |
|  └── EXIF / GPS Anti-Prank Pipeline   |    |  └── Open Rainfall & Discharge Feeds       |
+---------------------------------------+    +--------------------------------------------+
```

---

## ✨ Key Features

### 1. Geotechnical Slope Stability Engine
- Evaluates the **Factor of Safety ($FS$)** for Himalayan colluvium using pore-water pressure ($u$), soil cohesion ($c'$), and slope angle ($\theta$):
  $$FS = \frac{c' + (\gamma \cdot z - u) \cos^2\theta \tan\phi'}{\gamma \cdot z \sin\theta \cos\theta}$$
- Computes **Dynamic Hazard Scores (0–100)** mapping into 4 automated operational alert tiers:
  - **CRITICAL (Score $\ge 80$ or $FS < 1.0$):** Core Red Zone, triggers Section 144 warning and automated dispatch.
  - **WARNING ($60 \le \text{Score} < 80$):** Buffer Impact Zone, pre-emptive monitoring.
  - **ADVISORY ($40 \le \text{Score} < 60$):** Yellow Watch, field team alerts.
  - **NOMINAL:** Normal terrain stability.

### 2. Anti-Prank Field Verification Pipeline
- **Haversine Distance Delta Check**: Validates reported browser GPS against image EXIF metadata coordinates:
  $$\Delta d = \text{Haversine}(\text{Browser GPS}, \text{EXIF GPS}) < 300\text{m}$$
  Flags discrepancies as `SPOOFED_LOCATION_PRANK`.
- **Clock Drift Verification**: Compares image capture timestamp with server UTC:
  $$\Delta t = |\text{Server UTC} - \text{EXIF UTC}| < 120\text{s}$$
  Prevents historical reposting or recycled disaster media.

### 3. Real-Time Telemetry & WebSocket Dispatch
- Streams live telemetry from NWIC (National Water Informatics Centre) across Chamoli, Pithoragarh, Bageshwar, Tehri Garhwal, and Uttarkashi.
- Bidirectional WebSocket channel (`ws`) pushes live hazard status changes without client polling.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Google Maps JS API / Leaflet, Lucide Icons
- **Backend**: Node.js (ES Modules), Express.js 5, WebSockets (`ws`), CORS
- **AI & Analytics**: Python 3.10+, NumPy, Haversine, PIL (Pillow for EXIF extraction)
- **Data Integration**: NWIC Open Data Telemetry, Central Water Commission (CWC) APIs

---

## 🗂️ Repository Structure

```
SIH 2026 REDO/
├── Backend/
│   ├── src/
│   │   ├── ai/                # Node-wrapped predictive handlers
│   │   ├── api/               # API clients (NWIC & external services)
│   │   ├── controller/        # Incident & hazard controllers
│   │   ├── data/              # Static telemetry fallbacks & GeoJSON
│   │   ├── routes/            # Express endpoint routes
│   │   └── services/          # WebSocket broadcast & incident triage
│   ├── main.js                # Server bootstrap & WebSocket server
│   ├── test_backend.js        # Integration test suites
│   └── package.json
│
├── Backend AI/
│   ├── jev_model.py           # Geotechnical slope stability model
│   ├── anti_prank_pipeline.py # EXIF GPS & clock-drift verification
│   ├── water_portal_client.py # NWIC hydrological telemetry ingestion
│   ├── Data.md                # Telemetry blueprint specifications
│   └── README.md
│
└── Frontend/
    ├── src/
    │   ├── admin/             # Incident triage & emergency dispatch dashboard
    │   ├── user/              # Public civilian map HUD & report submission
    │   ├── services/          # WebSocket client & API fetchers
    │   ├── pages/             # Core route views
    │   ├── App.tsx            # Main shell & route controller
    │   └── main.tsx           # React DOM root
    ├── .env.example           # Environment template
    ├── vite.config.ts         # Vite bundler configuration
    └── package.json
```

---

## ⚙️ Environment Variables

### Frontend (`Frontend/.env`)
```ini
# Google Maps API Key for spatial rendering
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend HTTP API Endpoint
VITE_API_URL=http://localhost:3000/api

# Backend Real-Time WebSocket Endpoint
VITE_WS_URL=ws://localhost:3000/ws
```

### Backend (`Backend/.env`)
```ini
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **Python** (v3.9+)
- **npm** or **pnpm**

### 2. Backend Setup
```bash
cd Backend
npm install
npm run dev
```
*Backend runs on `http://localhost:3000` with WebSockets on `ws://localhost:3000/ws`.*

### 3. Backend AI Services Setup
```bash
cd "Backend AI"
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt # or install pillow, haversine, numpy
python jev_model.py
```

### 4. Frontend Setup
```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🤝 Contributing
Contributions to enhance model accuracy, add weather API telemetry, or expand GIS mapping capabilities are warmly welcomed.
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/EarlyWarning`).
3. Commit your changes (`git commit -m 'Add precipitation telemetry filter'`).
4. Push to the branch (`git push origin feature/EarlyWarning`).
5. Open a Pull Request.

---

## 📄 License
Open-source under the **ISC License**. Developed for the **Smart India Hackathon 2026**.
