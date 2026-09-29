import React, { useState } from 'react';
import type { RehabilitationStage, RehabilitationDocumentItem } from '../../types';

interface RehabilitationTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_STAGES: RehabilitationStage[] = [
  {
    stageNumber: 1,
    title: 'Joint Revenue & PWD Damage Survey (Geo-Tagging)',
    authority: 'SDM Chamoli & Geological Survey of India (GSI)',
    deadlineDate: 'Completed Sep 2026',
    daysRemaining: 0,
    isUrgent: false,
    status: 'COMPLETED',
    summary: 'In-situ physical assessment of structural subsidence and foundation shearing.',
    actionRequired: 'Verify your field survey token number in the master roster.',
    riskIfNotCompleted: 'Survey token is required for all subsequent compensation claims.',
  },
  {
    stageNumber: 2,
    title: 'Physical Submission of Land Title Deeds & Khatauni',
    authority: 'Tehsil Joshimath • Land Records (Revenue Desk #3)',
    deadlineDate: '18 Oct 2026',
    daysRemaining: 14,
    isUrgent: true,
    status: 'ACTIVE_URGENT',
    summary: 'In-person verification of original land ownership papers to prevent forfeiture of permanent resettlement rights.',
    actionRequired: 'Submit Certified Khatauni (Khatoni) and Registered Sale Deed physically at Tehsil Desk #3.',
    riskIfNotCompleted: 'CRITICAL RISK: Failure to submit before 18 Oct 2026 forfeits entitlement to permanent replacement land parcels and disqualifies the household from government resettlement schemes.',
  },
  {
    stageNumber: 3,
    title: 'Aadhaar-Seeded Bank Account (DBT) Compensation Claim',
    authority: 'District Treasury & National Informatics Centre (NIC)',
    deadlineDate: '25 Oct 2026',
    daysRemaining: 21,
    isUrgent: true,
    status: 'ACTIVE_URGENT',
    summary: 'Direct Benefit Transfer (DBT) processing of ₹1,50,000 interim ex-gratia + ₹5,00,000 structural replacement grant.',
    actionRequired: 'Submit self-attested bank passbook copy with active NPCI/Aadhaar mapping.',
    riskIfNotCompleted: 'Disbursement will be delayed into escrow and subject to legal inheritance audits.',
  },
  {
    stageNumber: 4,
    title: '7-Day Public Objection & Grievance Period',
    authority: 'Sub-Divisional Magistrate (SDM) Appellate Authority',
    deadlineDate: '02 Nov 2026',
    daysRemaining: 28,
    isUrgent: false,
    status: 'UPCOMING',
    summary: 'Statutory window to appeal building category classification (Category A Red vs Category B Yellow) or succession splits.',
    actionRequired: 'File Form-7 Objection with supporting photos if your structural grade is contested.',
    riskIfNotCompleted: 'Classifications become legally final and irrevocable after the 7-day period expires.',
  },
  {
    stageNumber: 5,
    title: 'Permanent Relocation Plot Allotment & Title Deed Handover',
    authority: 'Uttarakhand Housing & Urban Development Authority (UHUDA)',
    deadlineDate: '15 Nov 2026',
    daysRemaining: 42,
    isUrgent: false,
    status: 'UPCOMING',
    summary: 'Execution of registered ownership deed for surveyed habitable terrace plots at Gauchar Terrace or Pipalkoti Tableland.',
    actionRequired: 'Attend official biometric land registry allotment session with original identity documents.',
    riskIfNotCompleted: 'Unclaimed plots will be re-allocated to secondary emergency waitlists.',
  },
];

const MANDATORY_DOCUMENTS: RehabilitationDocumentItem[] = [
  {
    id: 'doc-khatoni',
    title: 'Certified Khatauni (Khatoni) / Revenue Extract',
    description: 'Current year certified revenue record showing Khasra / Gata numbers and ownership share.',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'Tehsildar Joshimath',
    submissionDesk: 'Tehsil Counter 3',
    penaltyIfMissing: 'Disqualification from replacement land plot allocation.',
  },
  {
    id: 'doc-deed',
    title: 'Original Registered Sale Deed / Mutation Order',
    description: 'Registered title deed proving lawful acquisition and inherited succession rights.',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'Sub-Registrar Office',
    submissionDesk: 'Tehsil Counter 3',
    penaltyIfMissing: 'Compensation kept in court escrow pending title litigation.',
  },
  {
    id: 'doc-aadhaar',
    title: 'Aadhaar Card + Biometric Authentication Slip',
    description: 'Original Aadhaar for head of household and all declared dependents (plus 2 self-attested photocopies).',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'UIDAI / District Helpdesk',
    submissionDesk: 'Verification Room B',
    penaltyIfMissing: 'DBT bank transfer cannot be initiated.',
  },
  {
    id: 'doc-passbook',
    title: 'Bank Passbook / Cancelled Cheque (Aadhaar Seeded)',
    description: 'Single or joint bank account with IFSC code, explicitly enabled for NPCI Aadhaar Payments Bridge (APB).',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'Nationalized Bank / SBI Joshimath',
    submissionDesk: 'Treasury Counter 1',
    penaltyIfMissing: '₹6.5 Lakh compensation transfer fails DBT processing.',
  },
  {
    id: 'doc-parivar',
    title: 'Family Register (Parivar Nakal) / Ration Card',
    description: 'Gram Panchayat certified copy of family register proving continuous physical residence in affected zone.',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'Gram Vikas Adhikari (VDO)',
    submissionDesk: 'Tehsil Counter 4',
    penaltyIfMissing: 'Inability to claim family relocation allowance.',
  },
  {
    id: 'doc-survey',
    title: 'GSI / SDRF Structural Crack Survey Token',
    description: 'Red-tagged building slip issued during door-to-door geological hazard marking.',
    isRequired: true,
    isMandatoryForPermanentCompensation: true,
    verificationAgency: 'NDRF / SDRF Survey Team',
    submissionDesk: 'Control Room Field Desk',
    penaltyIfMissing: 'Requires re-survey verification delaying claims by 30 days.',
  },
];

export const RehabilitationTimelineModal: React.FC<RehabilitationTimelineModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'checklist' | 'office'>('timeline');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    'doc-aadhaar': true,
    'doc-survey': true,
  });
  const [isExported, setIsExported] = useState(false);

  if (!isOpen) return null;

  const toggleDoc = (id: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalMandatoryDocs = MANDATORY_DOCUMENTS.length;
  const submittedDocsCount = Object.values(checkedDocs).filter(Boolean).length;
  const completionPct = Math.round((submittedDocsCount / totalMandatoryDocs) * 100);

  const handleExportSlip = () => {
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      id="rehabilitation-timeline-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-error text-white uppercase tracking-wider">
                  Gazette Notice UK-2024-88
                </span>
                <span className="text-xs text-on-surface-variant font-mono">Order #DM/REHAB/7702</span>
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-on-surface mt-0.5">
                Permanent Rehabilitation & Physical Document Submission Roster
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              onClick={onClose}
              type="button"
              title="Close Dialog"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Urgent Action Deadline Notice Banner */}
        <div className="bg-error/10 border-b border-error/30 p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-on-surface">
            <span className="material-symbols-outlined text-error text-xl shrink-0">alarm_on</span>
            <div>
              <span className="font-heading font-bold text-error">
                MANDATORY PHYSICAL SUBMISSION DEADLINE: 18 OCT 2026 (14 DAYS REMAINING)
              </span>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                To prevent forfeiture of permanent resettlement plots and ₹6,50,000 compensation grants, citizens MUST physically present original land deeds (Khatoni) at Tehsil Desk #3.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <a
              className="px-3 py-1.5 rounded-full bg-error text-white text-[11px] font-bold flex items-center gap-1 hover:bg-error/90 transition-colors shadow-xs"
              href="tel:1077"
            >
              <span className="material-symbols-outlined text-sm">call</span>
              <span>Helpline 1077</span>
            </a>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center border-b border-outline-variant/80 bg-surface-container/60 px-5 pt-2 gap-2 text-xs font-heading font-bold">
          <button
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('timeline')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">timeline</span>
            <span>Government Steps & Deadlines</span>
          </button>
          <button
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('checklist')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">checklist</span>
            <span>Physical Document Checklist ({submittedDocsCount}/{totalMandatoryDocs})</span>
          </button>
          <button
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'office'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setActiveTab('office')}
            type="button"
          >
            <span className="material-symbols-outlined text-base">apartment</span>
            <span>Physical Office & SDM Desk</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 tactical-scroll">
          
          {/* TAB 1: 5-STAGE GOVERNMENT REHABILITATION STEPS */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface font-bold uppercase tracking-wider">
                  Mandatory Legal Due-Process Sequence
                </span>
                <span className="text-on-surface-variant font-mono">Stage 2 of 5 Currently Active</span>
              </div>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-outline-variant">
                {DEFAULT_STAGES.map((stg) => (
                  <div
                    key={stg.stageNumber}
                    className={`relative pl-10 p-4 rounded-2xl border transition-all ${
                      stg.isUrgent
                        ? 'bg-error-container/20 border-error/40 shadow-xs'
                        : stg.status === 'COMPLETED'
                        ? 'bg-surface-container/60 border-outline-variant/60 opacity-80'
                        : 'bg-surface-container-low border-outline-variant/70'
                    }`}
                  >
                    {/* Circle Indicator on vertical line */}
                    <div
                      className={`absolute left-2.5 top-5 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                        stg.status === 'COMPLETED'
                          ? 'bg-[#2e7d32] text-white'
                          : stg.isUrgent
                          ? 'bg-error text-white animate-pulse'
                          : 'bg-surface-container-highest text-on-surface'
                      }`}
                    >
                      {stg.status === 'COMPLETED' ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        stg.stageNumber
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stg.status === 'COMPLETED'
                              ? 'bg-[#2e7d32]/20 text-[#2e7d32]'
                              : stg.isUrgent
                              ? 'bg-error text-white'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {stg.status === 'COMPLETED'
                            ? 'VERIFIED & CLOSED'
                            : stg.isUrgent
                            ? `URGENT: ${stg.daysRemaining} DAYS LEFT`
                            : 'SCHEDULED'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-mono">{stg.authority}</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface font-bold">
                        Target: {stg.deadlineDate}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-on-surface mt-1">
                      Stage {stg.stageNumber}: {stg.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{stg.summary}</p>

                    <div className="mt-2.5 p-2.5 rounded-xl bg-surface-container border border-outline-variant/60 text-xs">
                      <span className="font-bold text-primary block mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        Action Required from Citizen:
                      </span>
                      <p className="text-[11px] text-on-surface">{stg.actionRequired}</p>
                    </div>

                    {stg.riskIfNotCompleted && (
                      <div className="mt-2 p-2 rounded-xl bg-error/10 border border-error/20 text-[11px] text-error flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-base shrink-0">warning</span>
                        <span>{stg.riskIfNotCompleted}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MANDATORY PHYSICAL DOCUMENT CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-xs text-on-surface">
                    Submission Readiness Progress: {completionPct}% Complete
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {submittedDocsCount} of {totalMandatoryDocs} physical records marked verified.
                  </p>
                </div>
                <div className="w-28 bg-surface-container-high h-2.5 rounded-full overflow-hidden border border-outline-variant">
                  <div
                    className={`h-full transition-all duration-500 ${
                      completionPct === 100 ? 'bg-[#2e7d32]' : 'bg-primary'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {MANDATORY_DOCUMENTS.map((doc) => {
                  const isChecked = !!checkedDocs[doc.id];
                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-surface-container-low border-[#2e7d32]/40'
                          : 'bg-surface-container-low border-outline-variant hover:border-primary/50'
                      }`}
                      onClick={() => toggleDoc(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDoc(doc.id)}
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        id={doc.id}
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <label
                            htmlFor={doc.id}
                            className={`font-heading font-bold text-xs cursor-pointer ${
                              isChecked ? 'text-on-surface' : 'text-on-surface'
                            }`}
                          >
                            {doc.title}
                          </label>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-on-surface-variant self-start sm:self-auto">
                            Desk: {doc.submissionDesk}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          {doc.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-on-surface-variant pt-1.5 border-t border-outline-variant/40">
                          <span>Certifying Authority: <strong className="text-on-surface">{doc.verificationAgency}</strong></span>
                          <span className="text-error font-medium">Risk: {doc.penaltyIfMissing}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compensation Summary Card */}
              <div className="p-4 rounded-2xl bg-secondary-container/40 border border-outline-variant space-y-2">
                <span className="font-heading font-bold text-xs text-on-surface block uppercase tracking-wider">
                  Estimated Total Compensation Entitlement
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant">
                    <div className="text-[10px] text-on-surface-variant font-mono">Immediate Interim DBT</div>
                    <div className="text-sm font-bold text-primary mt-0.5">₹1,50,000</div>
                    <div className="text-[9px] text-[#2e7d32]">Direct Bank Wire</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant">
                    <div className="text-[10px] text-on-surface-variant font-mono">Structural Ex-Gratia</div>
                    <div className="text-sm font-bold text-primary mt-0.5">₹5,00,000</div>
                    <div className="text-[9px] text-on-surface-variant">Post Title Verification</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-on-surface-variant font-mono">Replacement Land Parcel</div>
                    <div className="text-sm font-bold text-[#2e7d32] mt-0.5">100 m² Plot</div>
                    <div className="text-[9px] text-[#2e7d32]">Gauchar / Pipalkoti Terrace</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHYSICAL OFFICE & SDM DESK */}
          {activeTab === 'office' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  <h4 className="font-heading font-bold text-sm text-on-surface">
                    Designated In-Person Physical Verification Office
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase">Physical Location</div>
                    <div className="font-bold text-on-surface mt-1">Tehsil Office Compound, Joshimath</div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Counter 3: Land Titling & Khatoni Registry Desk<br />
                      Counter 4: Aadhaar DBT Verification Desk
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase">Operating Hours</div>
                    <div className="font-bold text-on-surface mt-1">Monday to Saturday</div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      09:30 AM – 05:30 PM IST<br />
                      (Token distribution closes at 03:00 PM daily)
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase">Nodal Officer</div>
                    <div className="font-bold text-on-surface mt-1">Shri V. S. Negi, PCS</div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Sub-Divisional Magistrate (SDM Chamoli)<br />
                      Office: +91-1372-222107
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase">Emergency Helpline</div>
                    <div className="font-bold text-on-surface mt-1">Toll-Free 1077 (District SEOC)</div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      State SEOC Helpline: 1070<br />
                      Available 24x7 for transport assistance
                    </p>
                  </div>
                </div>
              </div>

              {/* Anti-Exploitation Legal Warning */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-on-surface space-y-1">
                <span className="font-heading font-bold text-amber-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">shield</span>
                  Anti-Exploitation & Fraud Prevention Notice
                </span>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Per SIH26191 and Uttarakhand Government directives, official replacement land plots cannot be sold, mortgaged, or transferred to third-party commercial cartels for 10 years. Never hand over original Khatoni papers to unregistered middlemen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-outline-variant bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] text-on-surface-variant font-mono text-center sm:text-left">
            <span>Verified against Uttarakhand Disaster Management Authority Gazette</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className={`flex-1 sm:flex-none px-4 py-2 rounded-full font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                isExported
                  ? 'bg-[#2e7d32] text-white'
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
              onClick={handleExportSlip}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {isExported ? 'check_circle' : 'receipt_long'}
              </span>
              <span>
                {isExported ? 'Physical Token Generated!' : 'Generate Desk Token Slip'}
              </span>
            </button>
            <button
              className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-heading font-bold text-xs transition-colors"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RehabilitationTimelineModal;
