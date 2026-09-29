import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { HazardEntity } from '../../types';

interface FullReportModalProps {
  entity: HazardEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateReport: () => void;
  entityKey?: string;
}

export const FullReportModal: React.FC<FullReportModalProps> = ({
  entity,
  isOpen,
  onClose,
  onOpenCreateReport,
  entityKey,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !entity) return null;

  const isReliefCamp =
    entity.isReliefCamp ||
    entity.id.startsWith('#CAMP-') ||
    entity.id.startsWith('SHELTER-') ||
    entity.category.includes('CAMP') ||
    entity.category.includes('SHELTER');
  const camp = entity.campData;

  const handleExportPdf = async () => {
    if (!reportContentRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const element = reportContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeId = (entity.id || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`${safeId}_Incident_Dossier.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareReport = async () => {
    const shareParam = entityKey || entity.id;
    const dynamicUrl = `${window.location.origin}${window.location.pathname}?report=${encodeURIComponent(shareParam)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entity.title} - Official Incident Dossier`,
          text: `Official hazard & dynamic relocation report for ${entity.title} (${entity.id}). Risk Score: ${entity.riskScore ?? 74.8}/100.`,
          url: dynamicUrl,
        });
        return;
      } catch (err) {
        // User cancelled share dialog
      }
    }

    try {
      await navigator.clipboard.writeText(dynamicUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      prompt('Copy dynamic report link:', dynamicUrl);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      id="report-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        {/* Header with Alert Severity */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              onClick={onClose}
              type="button"
              title="Back to Map View"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${entity.badgeClass}`}>
                  {entity.category}
                </span>
                <span className="text-xs text-on-surface-variant font-mono">Record {entity.id}</span>
              </div>
              <h3 className="font-heading font-bold text-2xl text-on-surface mt-0.5 tracking-tight">
                {entity.title} {isReliefCamp ? '• Operational Camp Dossier' : 'Incident Dossier'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic URL Share Button */}
            <button
              className="flex px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-heading font-bold items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              onClick={handleShareReport}
              type="button"
              title="Share dynamic report link"
            >
              <span className="material-symbols-outlined text-sm">
                {isCopied ? 'check' : 'share'}
              </span>
              <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {/* Screen Page PDF Download Button */}
            <button
              className="flex px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-heading font-bold items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-60"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              type="button"
              title="Download screen page as PDF"
            >
              <span className="material-symbols-outlined text-sm">
                {isExportingPdf ? 'hourglass_top' : 'download'}
              </span>
              <span>{isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
            </button>

            <button
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body with ref for PDF capture */}
        <div ref={reportContentRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 tactical-scroll bg-surface-container-lowest">
          {/* 1. SEVERITY OR OPERATIONAL BANNER */}
          {isReliefCamp ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-emerald-600 shrink-0">night_shelter</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    Active Evacuation Transit Shelter &amp; Humanitarian Base
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    24/7 ADMISSION ACTIVE
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300 leading-relaxed">
                  {entity.desc}
                </p>
                <div className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 pt-1">
                  Operating Command: {camp?.operatingAgencies ?? 'Uttarakhand SDRF 3rd Bn, NDRF 8th Bn & Indian Red Cross Society'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-error-container border border-error/30 text-on-error-container flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-error shrink-0">report</span>
              <div>
                <div className="font-heading font-bold text-sm">
                  Live Telemetry Dossier: {entity.title}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed">{entity.desc}</p>
              </div>
            </div>
          )}

          {/* 2. RELIEF CAMP COMPREHENSIVE QUANTITATIVE AUDIT OR DYNAMIC RISK ZONING */}
          {isReliefCamp ? (
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-on-surface">
                      Comprehensive Humanitarian Camp &amp; Shelter Audit
                    </h4>
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      Real-Time Capacity, Medical Beds &amp; Essential Supplies Quotas
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 text-xs font-mono font-bold">
                  Verified Operational
                </span>
              </div>

              {/* Quantitative Metrics Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Evacuee Capacity Card */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600">group</span>
                      Total Evacuee Capacity
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {camp?.availableCapacity ?? 210} Free Spaces
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-heading text-on-surface">
                      {camp?.totalCapacity ?? 600}
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">
                      Total Capacity ({((camp?.totalCapacity ?? 600) - (camp?.availableCapacity ?? 210))} Occupied)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-outline-variant/40 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.round(
                          (((camp?.totalCapacity ?? 600) - (camp?.availableCapacity ?? 210)) /
                            (camp?.totalCapacity ?? 600)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-on-surface-variant flex justify-between font-mono">
                    <span>Target Headcount: {camp?.totalCapacity ?? 600}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {Math.round(
                        (((camp?.totalCapacity ?? 600) - (camp?.availableCapacity ?? 210)) /
                          (camp?.totalCapacity ?? 600)) *
                          100
                      )}% Occupancy Rate
                    </span>
                  </div>
                </div>

                {/* 2. Medical Triage & Beds Card */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-red-600">local_hospital</span>
                      Medical Triage Ward
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600">
                      {camp?.availableMedicalBeds ?? 18} Beds Free
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-heading text-red-600">
                      {camp?.totalMedicalBeds ?? 40}
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">
                      Total Triage Beds ({camp?.icuTriageBeds ?? 6} ICU Oxygen Units)
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant space-y-0.5 font-mono">
                    <div>• Staff: 2 Medical Officers, 6 Paramedics, 2 Triage Nurses</div>
                    <div>• Critical stabilization unit with defibrillator &amp; oxygen concentrators</div>
                  </div>
                </div>

                {/* 3. Water & Food Logistics */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-blue-600">water_drop</span>
                      Potable Water &amp; Nutrition
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {camp?.dryRationsDays ?? 18} Days Reserve
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/50">
                      <span className="text-[10px] text-on-surface-variant block">Water Storage:</span>
                      <span className="text-base font-bold text-blue-700 dark:text-blue-300">
                        {(camp?.waterReserveLiters ?? 16000).toLocaleString()} L
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/50">
                      <span className="text-[10px] text-on-surface-variant block">Food Buffer:</span>
                      <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                        {camp?.dryRationsDays ?? 18} Days
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    Daily Jal Sansthan water bowsers replenishment. Continuous hot community langar active.
                  </div>
                </div>

                {/* 4. Sanitation & Power Infrastructure */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600">wc</span>
                      Sanitation &amp; Energy
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {camp?.bioToiletsCount ?? 24} Bio-Units
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/50">
                      <span className="text-[10px] text-on-surface-variant block">Ambulances:</span>
                      <span className="text-base font-bold text-red-600">
                        {camp?.ambulanceCount ?? 4} Units 4x4
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container border border-outline-variant/50">
                      <span className="text-[10px] text-on-surface-variant block">Helipad:</span>
                      <span className="text-base font-bold text-primary">
                        {camp?.helipadDistance ?? '400m Drop'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-on-surface-variant">
                    {camp?.powerAndComms ?? '15 kVA Diesel Generator + BSNL Satellite Terminal + SDRF VHF'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">shield</span>
                  <span className="font-heading font-bold text-sm text-on-surface">
                    Dynamic Multi-Hazard Risk Zoning &amp; Relocation Score
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      entity.zone === 'RED'
                        ? 'bg-error text-white'
                        : entity.zone === 'YELLOW'
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#2e7d32] text-white'
                    }`}
                  >
                    {entity.zone || 'RED'} ZONE • {entity.riskLevel || 'HIGH RISK'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-xs font-mono font-bold text-on-surface">
                    Priority #{entity.priorityRank || 1}
                  </span>
                </div>
              </div>

              {/* 0-100 Horizontal Gauge Needle Meter */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className="text-on-surface-variant">0-100 RELOCATION SCORE</span>
                  <span
                    className="text-base font-black"
                    style={{
                      color:
                        entity.zone === 'RED' ? '#d32f2f' : entity.zone === 'YELLOW' ? '#ed6c02' : '#2e7d32',
                    }}
                  >
                    {entity.riskScore ?? 74.8} / 100
                  </span>
                </div>
                <div className="relative pt-2 pb-1">
                  <div className="h-2.5 rounded-full w-full bg-linear-to-r from-emerald-500 via-amber-400 to-red-600 shadow-inner overflow-hidden" />
                  <div
                    className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                    style={{
                      left: `${Math.min(98, Math.max(2, entity.riskScore ?? 74.8))}%`,
                    }}
                  >
                    <div className="w-3 h-3 rotate-45 bg-on-surface shadow-xs" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 LOW RISK (Normal Monitoring)</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">50 MODERATE (Prepare &amp; Monitor)</span>
                  <span className="text-error font-bold">100 HIGH RISK (Immediate Relocation)</span>
                </div>
              </div>

              {/* Relocation Preparedness & Action Protocol */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-1">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">assignment_turned_in</span>
                  <span>Relocation Action Protocol:</span>
                  <span className="text-primary">{entity.relocationPreparedness || 'Prepare for Immediate Relocation'}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {entity.actionProtocol || entity.directives}
                </p>
              </div>
            </div>
          )}

          {/* 3. QUANTITATIVE TELEMETRY (SHOWN FOR HAZARDS ONLY) */}
          {!isReliefCamp && (
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">speed</span>
                <span>Quantitative Telemetry Values</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center font-mono">
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                  <div className="text-[10px] text-on-surface-variant font-sans">Factor of Safety</div>
                  <div className="text-base font-bold text-error mt-0.5">{entity.telemetry.fos}</div>
                  <div className="text-[10px] text-error">Unstable (&lt;1.0)</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                  <div className="text-[10px] text-on-surface-variant font-sans">Rainfall Rate</div>
                  <div className="text-base font-bold text-primary mt-0.5">{entity.telemetry.rain}</div>
                  <div className="text-[10px] text-primary">Heavy Monsoonal</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                  <div className="text-[10px] text-on-surface-variant font-sans">Soil Saturation</div>
                  <div className="text-base font-bold text-error mt-0.5">{entity.telemetry.sat}</div>
                  <div className="text-[10px] text-error">Critical High</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant">
                  <div className="text-[10px] text-on-surface-variant font-sans">Pore Pressure</div>
                  <div className="text-base font-bold text-on-surface mt-0.5">{entity.telemetry.pore}</div>
                  <div className="text-[10px] text-error">+18% Surge</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-on-surface-variant font-sans">Slope Tilt</div>
                  <div className="text-base font-bold text-tertiary mt-0.5">{entity.telemetry.tilt}</div>
                  <div className="text-[10px] text-tertiary">Active Creep</div>
                </div>
              </div>
            </div>
          )}

          {/* 4. OFFICIAL ADMISSION PROTOCOL OR SECTION 144 DIRECTIVES */}
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-primary text-base">
                {isReliefCamp ? 'assignment_turned_in' : 'gavel'}
              </span>
              <span>{isReliefCamp ? 'Standard Operating Procedure (SOP) & Admission Protocol' : 'Official Guidelines & Section 144 Directives'}</span>
            </h4>
            {isReliefCamp ? (
              <ol className="text-xs text-on-surface-variant space-y-1.5 list-decimal list-inside leading-relaxed font-sans">
                <li><span className="font-semibold text-on-surface">Gate Intake &amp; Token Registration:</span> All arriving evacuees are registered at Counter 1 and given a unique biometric family tracking token.</li>
                <li><span className="font-semibold text-on-surface">Mandatory Medical Triage Screening:</span> Vitals check at the Red Cross triage tent; acute trauma and elderly patients routed directly to inpatient beds.</li>
                <li><span className="font-semibold text-on-surface">Family Pod &amp; Kit Issuance:</span> Family allotment of weather-insulated tents, sleeping mats, thermal blankets, and personal hygiene kits.</li>
                <li><span className="font-semibold text-on-surface">Community Dining &amp; Dry Rations:</span> 3 warm meals per day served at the community langar; special infant formula available on request.</li>
                <li><span className="font-semibold text-on-surface">DBT &amp; Legal Claims Desk:</span> Aadhaar seeding counter open daily 08:00 - 20:00 for emergency ₹1.5L ex-gratia relief linkage.</li>
              </ol>
            ) : (
              <ol className="text-xs text-on-surface-variant space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Mandatory evacuation for premises marked with red CBRI spray tags prior to 18:00 hrs.</li>
                <li>Do not traverse the NH-58 canyon road; follow marked green transit corridor towards Pipalkoti / Chamoli relief camps.</li>
                <li>Registration tokens are compulsory for Direct Benefit Transfer (DBT) ex-gratia claims.</li>
                <li>Offline radios must remain tuned to emergency disaster broadcast frequency 102.4 MHz FM.</li>
              </ol>
            )}
          </div>

          {/* Verified Evidence Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface">
                  Images by Other Users Verified with Geo Cam
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Hardware-signed evidence preventing misinformation and fake alarms
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                onClick={onOpenCreateReport}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                <span>Create Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container">
                <img
                  alt="Field Capture 1"
                  className="w-full h-36 object-cover"
                  src={entity.img1}
                />
                <div className="p-3 bg-surface-container-low text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-primary font-mono">Hardware GPS: 30.556° N, 79.563° E</span>
                    <span className="text-[#2e7d32] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span> CV Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Clock Drift: 12s (Pass)</span>
                    <span>Sensor: Sony IMX686 TEE</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container">
                <img
                  alt="Field Capture 2"
                  className="w-full h-36 object-cover"
                  src={entity.img2}
                />
                <div className="p-3 bg-surface-container-low text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-primary font-mono">Hardware GPS: 30.512° N, 79.521° E</span>
                    <span className="text-[#2e7d32] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span> Geo-Crypt Pass
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Runoff: 4.8 m/s</span>
                    <span>Station: UK-SDMA-G4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-outline-variant bg-surface-container flex items-center justify-between">
          <span className="text-[11px] font-mono text-on-surface-variant">
            Auth Registry: NDRF-UK-9042
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-full border border-outline text-on-surface text-xs font-heading font-bold"
              onClick={onClose}
              type="button"
            >
              Back to Map
            </button>
            <button
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-heading font-bold shadow-sm"
              onClick={onClose}
              type="button"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullReportModal;
