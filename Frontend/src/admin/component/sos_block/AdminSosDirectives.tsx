import React, { useState, useEffect } from 'react';
import type { GazetteOrderPayload, GeneratedAiDossier } from '../../types';
import {
  issueGazetteDirective,
  broadcastEmergencyThreatAlert,
  type EmergencyThreatAlertPayload,
} from '../../../services/api';
import jsPDF from 'jspdf';

interface AdminSosDirectivesProps {
  onBroadcastDirective?: (payload: GazetteOrderPayload) => void;
  onBroadcastAlert?: (payload: EmergencyThreatAlertPayload) => void;
}

const SECTOR_PRESETS = [
  {
    name: 'Joshimath Ravigram Sector',
    coords: { lat: 30.556, lng: 79.563 },
    threat: 'Geotechnical Deep Slope Subsidence',
    radius: 3200,
    severity: 'CRITICAL' as const,
    defaultAlert:
      'DEFCON 1: Accelerated ground subsidence in Ward 4 & 5. Immediate life-safety evacuation ordered. Siren active.',
    defaultDirective:
      'Section 144 Statutory Gazette Order enforced. Relocation of red-flagged structures to Gauchar Staging Hub. Submit land revenue deeds for DBT ex-gratia disbursal.',
    compensation: 150000,
    families: 412,
  },
  {
    name: 'Chamoli NH-58 KM 214 Road Slip',
    coords: { lat: 30.512, lng: 79.521 },
    threat: 'Talus Rockfall & Highway Blockade',
    radius: 2400,
    severity: 'CRITICAL' as const,
    defaultAlert:
      'Major talus rockfall severed NH-58 at KM 214. High velocity debris flow active. Civilian traffic halted immediately.',
    defaultDirective:
      'Total vehicular lockdown at KM 214. PWD earthmovers mobilized. Civilian transit diverted via Pipalkoti corridor.',
    compensation: 0,
    families: 95,
  },
  {
    name: 'Sunil Ward Upper Terrace',
    coords: { lat: 30.56, lng: 79.57 },
    threat: 'Glacial Till Creep & Fissure Widening',
    radius: 2100,
    severity: 'SEVERE' as const,
    defaultAlert:
      'Perimeter warning: Subsurface sensor detected 4.2mm lateral fissure expansion. High standby alert.',
    defaultDirective:
      'Pre-emptive relocation advisory. Residents advised to prepare land deeds and report to Tehsil Desk for phase 2 relocation roster.',
    compensation: 150000,
    families: 630,
  },
  {
    name: 'Pipalkoti North Corridor',
    coords: { lat: 30.429, lng: 79.33 },
    threat: 'Hydrological Flash Flood & River Surge',
    radius: 4800,
    severity: 'SEVERE' as const,
    defaultAlert:
      'Alaknanda upstream dam discharge alert. Rapid water surge. Evacuate riverbed settlements immediately.',
    defaultDirective:
      'Riverbed habitation closure under Section 144. Relocation of riverside pilgrimage camps to higher terraces.',
    compensation: 100000,
    families: 180,
  },
  {
    name: 'Mana Village Border Pass',
    coords: { lat: 30.744, lng: 79.493 },
    threat: 'High Altitude Talus & Glacial Runoff',
    radius: 2500,
    severity: 'SEVERE' as const,
    defaultAlert:
      'Glacial runoff alert in upper catchment. Civilian vehicle movement restricted past checkpost.',
    defaultDirective:
      'Border pass civilian restriction under DMA 2005. SDRF quick response unit stationed at Km 72 checkpost.',
    compensation: 50000,
    families: 65,
  },
  {
    name: 'Gauchar Alluvial Tableland',
    coords: { lat: 30.291, lng: 79.155 },
    threat: 'Designated Safe Resettlement Staging Hub',
    radius: 5000,
    severity: 'ADVISORY' as const,
    defaultAlert:
      'Safe Resettlement Corridor active. 58 emergency transit beds and dry ration supplies standing by.',
    defaultDirective:
      'Permanent resettlement staging area operational. Medical triage, community kitchen, and emergency helipad 24/7.',
    compensation: 0,
    families: 0,
  },
];

export const AdminSosDirectives: React.FC<AdminSosDirectivesProps> = ({
  onBroadcastDirective,
  onBroadcastAlert,
}) => {
  // Mode Selection: Two Distinct Tools
  const [activeTab, setActiveTab] = useState<'ALERT' | 'GAZETTE'>('ALERT');

  // Shared Sector Location State
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [isCustomSector, setIsCustomSector] = useState(false);
  const [customSectorName, setCustomSectorName] = useState('');
  const [lat, setLat] = useState<number>(SECTOR_PRESETS[0].coords.lat);
  const [lng, setLng] = useState<number>(SECTOR_PRESETS[0].coords.lng);
  const [threatCategory, setThreatCategory] = useState<string>(SECTOR_PRESETS[0].threat);
  const [threatSeverity, setThreatSeverity] = useState<'CRITICAL' | 'SEVERE' | 'ADVISORY'>('CRITICAL');
  const [threatRadiusMeters, setThreatRadiusMeters] = useState<number>(SECTOR_PRESETS[0].radius);
  const [authority, setAuthority] = useState(
    'Col. R. Sharma (Retd.) • District Magistrate & SDRF Unified Command'
  );

  // -------------------------------------------------------------
  // TAB 1: EMERGENCY GOVERNMENT BROADCAST ALERT STATE
  // -------------------------------------------------------------
  const [alertOrderType, setAlertOrderType] = useState('Emergency Evacuation Siren Warning');
  const [alertDirectiveText, setAlertDirectiveText] = useState(SECTOR_PRESETS[0].defaultAlert);
  const [pushBleMeshSiren, setPushBleMeshSiren] = useState(true);
  const [isAlertBroadcasting, setIsAlertBroadcasting] = useState(false);
  const [lastAlertBroadcastSuccess, setLastAlertBroadcastSuccess] = useState<{
    id: string;
    timestamp: string;
    sector: string;
    recipients?: number;
  } | null>(null);

  // -------------------------------------------------------------
  // TAB 2: OFFICIAL GAZETTE RELOCATION DIRECTIVE STATE
  // -------------------------------------------------------------
  const [gazetteOrderCode, setGazetteOrderCode] = useState(
    `UK-GOV-${new Date().getFullYear()}-GAZ-412`
  );
  const [gazetteOrderType, setGazetteOrderType] = useState(
    'Section 144 Statutory Relocation Directive'
  );
  const [gazetteDirectiveText, setGazetteDirectiveText] = useState(
    SECTOR_PRESETS[0].defaultDirective
  );
  const [compensationPerFamily, setCompensationPerFamily] = useState<number>(150000);
  const [targetFamilies, setTargetFamilies] = useState<number>(412);
  const [deadlineDate, setDeadlineDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [isGazetteProcessing, setIsGazetteProcessing] = useState(false);
  const [generatedDossier, setGeneratedDossier] = useState<GeneratedAiDossier | null>(null);

  // Live Weather Telemetry State for Location
  const [liveWeather, setLiveWeather] = useState<{
    tempC: number;
    rainMmh: number;
    humidity: number;
    soilSatPct: number;
  } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // Fetch live weather from Open-Meteo whenever coordinates change
  useEffect(() => {
    let isCancelled = false;
    const fetchWeather = async () => {
      setIsFetchingWeather(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain&hourly=soil_moisture_0_to_1cm&forecast_days=1`;
        const res = await fetch(url);
        if (res.ok && !isCancelled) {
          const d = await res.json();
          const temp = Number(d.current?.temperature_2m || 18.2);
          const rain = Number(d.current?.rain || d.current?.precipitation || 0);
          const hum = Number(d.current?.relative_humidity_2m || 64);
          const soilM = Number(d.hourly?.soil_moisture_0_to_1cm?.[12] || 0.32);
          setLiveWeather({
            tempC: temp,
            rainMmh: rain,
            humidity: hum,
            soilSatPct: Math.round(soilM * 250),
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setLiveWeather({ tempC: 18.5, rainMmh: 0, humidity: 65, soilSatPct: 74 });
        }
      } finally {
        if (!isCancelled) setIsFetchingWeather(false);
      }
    };

    fetchWeather();
    return () => {
      isCancelled = true;
    };
  }, [lat, lng]);

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    if (idx === -1) {
      setIsCustomSector(true);
      return;
    }
    setIsCustomSector(false);
    const p = SECTOR_PRESETS[idx];
    setLat(p.coords.lat);
    setLng(p.coords.lng);
    setThreatCategory(p.threat);
    setThreatSeverity(p.severity);
    setThreatRadiusMeters(p.radius);
    setAlertDirectiveText(p.defaultAlert);
    setGazetteDirectiveText(p.defaultDirective);
    setCompensationPerFamily(p.compensation);
    setTargetFamilies(p.families);
  };

  // -------------------------------------------------------------
  // ACTION 1: BROADCAST EMERGENCY THREAT ALERT (WEBSOCKET)
  // -------------------------------------------------------------
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAlertBroadcasting(true);
    setLastAlertBroadcastSuccess(null);

    const targetSector = isCustomSector
      ? customSectorName || 'Custom Emergency Sector'
      : SECTOR_PRESETS[selectedPresetIdx].name;

    const payload: EmergencyThreatAlertPayload = {
      orderType: alertOrderType,
      targetSector,
      directiveText: alertDirectiveText,
      pushBleMeshSiren,
      coordinates: { lat: Number(lat), lng: Number(lng) },
      threatCategory,
      threatSeverity,
      threatRadiusMeters: Number(threatRadiusMeters),
      authority,
    };

    try {
      const res = await broadcastEmergencyThreatAlert(payload);
      if (res.success && res.data) {
        setLastAlertBroadcastSuccess({
          id: res.data.id,
          timestamp: res.data.timestamp,
          sector: res.data.targetSector,
        });
      }
      if (onBroadcastAlert) {
        onBroadcastAlert(payload);
      }
    } catch (err) {
      console.error('Error broadcasting emergency alert:', err);
    } finally {
      setIsAlertBroadcasting(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION 2: PUBLISH OFFICIAL GAZETTE RELOCATION DIRECTIVE
  // -------------------------------------------------------------
  const handlePublishGazette = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGazetteProcessing(true);
    setGeneratedDossier(null);

    const targetSector = isCustomSector
      ? customSectorName || 'Custom Gazette Sector'
      : SECTOR_PRESETS[selectedPresetIdx].name;

    const payload: GazetteOrderPayload = {
      orderType: gazetteOrderType,
      targetSector,
      directiveText: gazetteDirectiveText,
      pushBleMeshSiren: false, // Gazette is legal, distinct from siren
      coordinates: { lat: Number(lat), lng: Number(lng) },
      threatCategory,
      threatSeverity,
      threatRadiusMeters: Number(threatRadiusMeters),
      compensationPerFamilyInr: Number(compensationPerFamily),
      targetFamilies: Number(targetFamilies),
      deadlineDate,
      authority,
    };

    try {
      const res = await issueGazetteDirective(payload);
      if (res.report) {
        setGeneratedDossier(res.report);
      }
      if (onBroadcastDirective) {
        onBroadcastDirective(payload);
      }
    } catch (err) {
      console.error('Error publishing gazette directive:', err);
    } finally {
      setIsGazetteProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // EXPORT OFFICIAL GAZETTE PDF
  // -------------------------------------------------------------
  const handleExportPdf = () => {
    if (!generatedDossier) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont('helvetica');

    // Header
    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('GOVERNMENT OF UTTARAKHAND • STATE DISASTER MANAGEMENT AUTHORITY', 14, 11);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL STATUTORY GAZETTE DIRECTIVE & REHABILITATION ENFORCEMENT ORDER', 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`GAZETTE ORDER CODE: ${generatedDossier.order_code}`, 14, 34);
    doc.text(`DOSSIER ID: ${generatedDossier.report_id}`, 120, 34);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 37, 196, 37);

    // Section 1: Relocation Sector
    doc.setFontSize(10);
    doc.text(`1. TARGET RELOCATION SECTOR: ${generatedDossier.sector_name}`, 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Coordinates: ${generatedDossier.coordinates.lat.toFixed(4)}°N, ${generatedDossier.coordinates.lng.toFixed(4)}°E`,
      14,
      51
    );
    doc.text(
      `Statutory Perimeter: ${generatedDossier.threat_radius_meters}m (Speculative AI bypassed by Gazette order)`,
      14,
      57
    );
    doc.text(
      `Threat Classification: ${generatedDossier.threat_category} [${generatedDossier.threat_severity}]`,
      14,
      63
    );

    // Section 2: Financial DBT Disbursal
    doc.setFont('helvetica', 'bold');
    doc.text('2. EX-GRATIA DBT COMPENSATION & FINANCIAL ALLOCATION ROSTER', 14, 73);
    doc.setFont('helvetica', 'normal');
    if (generatedDossier.compensation) {
      doc.text(
        `• Direct Benefit Transfer (DBT): ₹${generatedDossier.compensation.per_family_inr.toLocaleString('en-IN')} per registered family`,
        18,
        80
      );
      doc.text(
        `• Target Roster Count: ${generatedDossier.compensation.target_families} citizen families in Red Zone`,
        18,
        86
      );
      doc.text(
        `• Total Treasury Budget Committed: ₹${generatedDossier.compensation.total_budget_cr} Crores (State Disaster Fund)`,
        18,
        92
      );
      doc.text(
        `• Revenue Document Submission Deadline: ${generatedDossier.compensation.deadline_date}`,
        18,
        98
      );
    }

    // Section 3: AI Geotechnical & Slope Safety
    doc.setFont('helvetica', 'bold');
    doc.text('3. JEV GEOTECHNICAL STABILITY JUSTIFICATION & RISK CLASSIFICATION', 14, 108);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `• Factor of Safety (FS): ${generatedDossier.geotechnical_analysis.factor_of_safety} (Sub-critical threshold < 1.0)`,
      18,
      115
    );
    doc.text(
      `• Dynamic Hazard Relocation Score: ${generatedDossier.geotechnical_analysis.hazard_score} / 100`,
      18,
      121
    );
    doc.text(
      `• DMA 2005 Enforcement: ${generatedDossier.geotechnical_analysis.sec144_enforceable ? 'SECTION 144 MANDATED' : 'ADVISORY'}`,
      18,
      127
    );
    doc.text(
      `• AI Recommendation: ${generatedDossier.geotechnical_analysis.recommendation}`,
      18,
      133,
      { maxWidth: 175 }
    );

    // Section 4: Gazette Clauses
    doc.setFont('helvetica', 'bold');
    doc.text('4. STATUTORY EXECUTIVE DIRECTIVES & LEGAL REHABILITATION CLAUSES', 14, 149);
    doc.setFont('helvetica', 'normal');
    doc.text(generatedDossier.directives, 18, 156, { maxWidth: 175 });

    // Sign off & Seal
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 205, 196, 205);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHORIZED SIGN-OFF & STATE DIGITAL SEAL:', 14, 213);
    doc.setFont('helvetica', 'normal');
    doc.text(generatedDossier.sign_off.nodal_officer, 14, 220);
    doc.text(`Digital Verification Stamp: ${generatedDossier.sign_off.approval_stamp}`, 14, 226);
    doc.text(`Enacted: ${new Date().toLocaleString('en-IN')} IST`, 14, 232);

    doc.save(`${generatedDossier.order_code}_Official_Gazette_Directive.pdf`);
  };

  const bufferThresholdKm = ((threatRadiusMeters + 20000) / 1000).toFixed(1);

  return (
    <div className="bg-surface-container-low rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden space-y-0">
      {/* Top Tab Switcher: Separating Gazette Orders vs Emergency Alerts */}
      <div className="flex border-b border-outline-variant/60 bg-surface-container-low px-4 pt-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALERT')}
          className={`pb-3 px-4 font-heading font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ALERT'
              ? 'border-error text-error bg-error/5 rounded-t-xl'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg animate-pulse text-error">crisis_alert</span>
          <span className="uppercase tracking-wider">1. Emergency Threat Alert</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-error text-on-error font-mono font-bold">
            LIVE BROADCAST
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GAZETTE')}
          className={`pb-3 px-4 font-heading font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'GAZETTE'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg text-primary">gavel</span>
          <span className="uppercase tracking-wider">2. Official Gazette Directive</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary text-on-primary font-mono font-bold">
            LEGAL ROSTER
          </span>
        </button>
      </div>

      <div className="p-5 md:p-6 space-y-5">
        {/* Tool Header Banner */}
        <div className="flex items-center justify-between border-b border-outline-variant/50 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                activeTab === 'ALERT' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">
                {activeTab === 'ALERT' ? 'campaign' : 'policy'}
              </span>
            </div>
            <div>
              <h2 className="font-heading font-bold text-base md:text-lg text-on-surface">
                {activeTab === 'ALERT'
                  ? 'Broadcast Emergency Government Threat Alert'
                  : 'Publish Official Gazette Relocation Directive'}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {activeTab === 'ALERT'
                  ? 'Real-Time WebSockets Siren Broadcast • 20km Proximity-Aware Citizen Notification'
                  : 'Section 144 DM Act 2005 • ₹1.5L DBT Ex-gratia Roster • Official Legal PDF Export'}
              </p>
            </div>
          </div>
          <span
            className={`hidden sm:inline-block text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              activeTab === 'ALERT' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
            }`}
          >
            {activeTab === 'ALERT' ? 'WEBSOCKET BROADCASTER' : 'GAZETTE REGISTRY'}
          </span>
        </div>

        {/* Proximity Rule Notice */}
        {activeTab === 'ALERT' && (
          <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/60 flex items-start gap-3 text-xs">
            <span className="material-symbols-outlined text-error text-lg mt-0.5">radar</span>
            <div className="space-y-1">
              <span className="font-bold text-on-surface block">
                20km Impact Radius Rule Active:
              </span>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                • <strong>Citizens within range (&le; {bufferThresholdKm} km):</strong> Alert pops up in the <strong>center of screen with background blur</strong>, requiring manual [X] closure.
                <br />
                • <strong>Citizens outside range (&gt; {bufferThresholdKm} km):</strong> Notification pops up as a <strong>top-right card</strong> and <strong>fades automatically after 5 seconds</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Live Weather Ingestion Pill */}
        {liveWeather && (
          <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/40 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-on-surface font-bold">Open-Meteo Live Sensor:</span>
              <span className="text-outline">
                {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-on-surface">🌡️ {liveWeather.tempC}°C</span>
              <span className="text-primary font-bold">🌧️ {liveWeather.rainMmh} mm/h</span>
              <span className="text-amber-600 dark:text-amber-400">💧 Soil Sat: {liveWeather.soilSatPct}%</span>
              {isFetchingWeather && <span className="animate-spin text-xs">↻</span>}
            </div>
          </div>
        )}

        {/* Sector Preset Selector (Shared) */}
        <div>
          <label className="text-xs font-mono font-bold uppercase text-on-surface block mb-2">
            1. Select Operational Target Sector
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTOR_PRESETS.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  !isCustomSector && selectedPresetIdx === idx
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-outline-variant/60 bg-surface-container hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div className="text-xs font-heading truncate">{p.name}</div>
                <div className="text-[10px] font-mono text-outline flex items-center justify-between mt-1">
                  <span>{p.radius}m</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] ${
                      p.severity === 'CRITICAL'
                        ? 'text-error'
                        : p.severity === 'SEVERE'
                        ? 'text-amber-600'
                        : 'text-primary'
                    }`}
                  >
                    {p.severity}
                  </span>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSelectPreset(-1)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isCustomSector
                  ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                  : 'border-outline-variant/60 bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
            >
              <div className="text-xs font-heading">Custom Sector</div>
              <div className="text-[10px] font-mono text-outline mt-1">Specify GPS Coords</div>
            </button>
          </div>

          {isCustomSector && (
            <div className="mt-2.5">
              <input
                type="text"
                value={customSectorName}
                onChange={(e) => setCustomSectorName(e.target.value)}
                placeholder="Enter custom sector name (e.g. Joshimath Ward 3 Upper Slip)"
                className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EMERGENCY THREAT ALERT FORM (LIVE WEBSOCKET BROADCAST)             */}
        {/* ========================================================================= */}
        {activeTab === 'ALERT' && (
          <form onSubmit={handleBroadcastAlert} className="space-y-4">
            {/* Alert Type & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Alert Order Type
                </label>
                <select
                  value={alertOrderType}
                  onChange={(e) => setAlertOrderType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Emergency Evacuation Siren Warning">Emergency Evacuation Siren Warning</option>
                  <option value="Flash Flood Red Alert Siren">Flash Flood Red Alert Siren</option>
                  <option value="Section 144 Curfew Lockdown">Section 144 Curfew Lockdown</option>
                  <option value="Immediate Talus Rockfall Advisory">Immediate Talus Rockfall Advisory</option>
                  <option value="High Altitude Glacier Breach Alert">High Altitude Glacier Breach Alert</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Threat Severity (DEFCON)
                </label>
                <select
                  value={threatSeverity}
                  onChange={(e) => setThreatSeverity(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-bold text-error"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Siren &amp; Defcon 1)</option>
                  <option value="SEVERE">SEVERE (High Priority Evacuation Advisory)</option>
                  <option value="ADVISORY">ADVISORY (General Precautionary Buffer)</option>
                </select>
              </div>
            </div>

            {/* Coordinates & Threat Radius */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Impact Radius ({threatRadiusMeters}m)
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={threatRadiusMeters}
                  onChange={(e) => setThreatRadiusMeters(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <span className="text-[10px] font-mono text-outline block text-right">
                  Range buffer: +20km ({bufferThresholdKm} km total)
                </span>
              </div>
            </div>

            {/* Directive Message */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                Emergency Alert Directive Message
              </label>
              <textarea
                rows={3}
                value={alertDirectiveText}
                onChange={(e) => setAlertDirectiveText(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                placeholder="Enter life-safety instructions..."
                required
              />
            </div>

            {/* BLE Mesh Siren Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/60">
              <input
                type="checkbox"
                id="pushBleSiren"
                checked={pushBleMeshSiren}
                onChange={(e) => setPushBleMeshSiren(e.target.checked)}
                className="w-4 h-4 rounded text-error focus:ring-error"
              />
              <label htmlFor="pushBleSiren" className="text-xs text-on-surface font-medium cursor-pointer">
                <strong>Activate BLE Mesh Siren Beacons &amp; Cell Broadcast:</strong> Rings emergency siren audio on all citizen devices.
              </label>
            </div>

            {/* Broadcast Success Confirmation */}
            {lastAlertBroadcastSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">sensors</span>
                  <div>
                    <span className="font-bold block">
                      Emergency Alert Dispatched Live via WebSockets!
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      Sector: {lastAlertBroadcastSuccess.sector} • Time: {lastAlertBroadcastSuccess.timestamp}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-bold">
                  BROADCAST_OK
                </span>
              </div>
            )}

            {/* Broadcast Submit Button */}
            <button
              type="submit"
              disabled={isAlertBroadcasting}
              className="w-full py-3.5 px-6 rounded-2xl bg-error hover:bg-error/90 text-on-error font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-error/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isAlertBroadcasting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  <span>Transmitting across WebSockets...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg animate-pulse">crisis_alert</span>
                  <span>BROADCAST EMERGENCY ALERT (WEBSOCKET)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OFFICIAL GAZETTE DIRECTIVE FORM (LEGAL MANDATE & REHABILITATION)   */}
        {/* ========================================================================= */}
        {activeTab === 'GAZETTE' && (
          <form onSubmit={handlePublishGazette} className="space-y-4">
            {/* Gazette Order Code & Legal Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Gazette Order Code
                </label>
                <input
                  type="text"
                  value={gazetteOrderCode}
                  onChange={(e) => setGazetteOrderCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                  Statutory Order Classification
                </label>
                <select
                  value={gazetteOrderType}
                  onChange={(e) => setGazetteOrderType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value="Section 144 Statutory Relocation Directive">Section 144 Statutory Relocation Directive</option>
                  <option value="Disaster Management Act 2005 Land Acquisition">Disaster Management Act 2005 Land Acquisition</option>
                  <option value="Permanent Habitation Resettlement Mandate">Permanent Habitation Resettlement Mandate</option>
                  <option value="Pre-emptive Relocation &amp; DBT Compensation Order">Pre-emptive Relocation &amp; DBT Compensation Order</option>
                </select>
              </div>
            </div>

            {/* Financial DBT Compensation & Families Roster */}
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">payments</span>
                  Direct Benefit Transfer (DBT) Rehabilitation Allocation
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  Total: ₹{(((compensationPerFamily * targetFamilies) / 10000000) || 0).toFixed(2)} Cr
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-outline block mb-1 uppercase">
                    DBT Compensation / Family (₹)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={compensationPerFamily}
                    onChange={(e) => setCompensationPerFamily(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-outline block mb-1 uppercase">
                    Target Affected Families
                  </label>
                  <input
                    type="number"
                    value={targetFamilies}
                    onChange={(e) => setTargetFamilies(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-outline block mb-1 uppercase">
                    Document Verification Deadline
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Gazette Clauses */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                Statutory Gazette Directives &amp; Verification Terms
              </label>
              <textarea
                rows={3}
                value={gazetteDirectiveText}
                onChange={(e) => setGazetteDirectiveText(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                placeholder="Enter formal statutory clauses for physical land revenue verification and relocation..."
                required
              />
            </div>

            {/* Issuing Authority */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase text-on-surface block mb-1">
                Issuing Administrative Authority
              </label>
              <input
                type="text"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface"
              />
            </div>

            {/* Gazette Publish Button */}
            <button
              type="submit"
              disabled={isGazetteProcessing}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isGazetteProcessing ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  <span>Generating Autonomous AI Geotechnical Dossier...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">gavel</span>
                  <span>PUBLISH OFFICIAL GAZETTE DIRECTIVE &amp; DOSSIER</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Generated AI Dossier Results & Export PDF (Appears when Gazette is published) */}
        {generatedDossier && (
          <div className="p-4 rounded-2xl bg-surface border border-emerald-500/40 shadow-md space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-heading font-bold text-sm">
                <span className="material-symbols-outlined text-emerald-600">verified</span>
                <span>Official Gazette Directive Enacted &amp; AI Intelligence Report Compiled</span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                {generatedDossier.order_code}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/40">
                <span className="text-[10px] text-on-surface-variant block uppercase font-bold">1. Detected Threat</span>
                <span className="font-bold text-on-surface mt-0.5 block truncate">{generatedDossier.threat_category}</span>
                <span className="text-[10px] text-error font-semibold mt-1 block">Severity: {generatedDossier.threat_severity}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/40">
                <span className="text-[10px] text-on-surface-variant block uppercase font-bold">2. Local Weather (Live)</span>
                <span className="font-bold text-on-surface mt-0.5 block">
                  {generatedDossier.live_weather.temp_c}°C • Rain: {generatedDossier.live_weather.rain_mmh} mm/h
                </span>
                <span className="text-[10px] text-primary font-semibold mt-1 block">
                  Soil Saturation: {generatedDossier.live_weather.soil_saturation_pct}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/40">
                <span className="text-[10px] text-on-surface-variant block uppercase font-bold">3. JEV Geotechnical</span>
                <span className="font-bold text-red-600 mt-0.5 block">
                  FoS: {generatedDossier.geotechnical_analysis.factor_of_safety} • Score: {generatedDossier.geotechnical_analysis.hazard_score}/100
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold mt-1 block">
                  Section 144 Legal Order Active
                </span>
              </div>
            </div>

            {/* Action Bar: Export Gazette PDF */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-on-surface-variant font-mono">
                Dossier Key: <strong>{generatedDossier.report_id}</strong> • AI predictions bypassed
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="py-2 px-4 rounded-xl bg-primary text-on-primary font-heading font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                  <span>Export Official Gazette PDF</span>
                </button>
                <a
                  href={`/reports/${generatedDossier.report_id.toLowerCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-4 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-heading font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>View Dossier Report</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSosDirectives;
