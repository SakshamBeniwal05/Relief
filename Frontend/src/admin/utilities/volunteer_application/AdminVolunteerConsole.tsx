import React, { useState } from 'react';
import type { VolunteerApplicant } from '../../types';

interface AdminVolunteerConsoleProps {
  initialApplicants: VolunteerApplicant[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const AdminVolunteerConsole: React.FC<AdminVolunteerConsoleProps> = ({
  initialApplicants,
  onApprove,
  onReject,
}) => {
  const [applicants, setApplicants] = useState<VolunteerApplicant[]>(initialApplicants);
  const [filterType, setFilterType] = useState<string>('all');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleApprove = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'approved' } : app))
    );
    if (onApprove) onApprove(id);
    showAlert(`Approved & Deployed: ${name} to sector.`);
  };

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'rejected' } : app))
    );
    if (onReject) onReject(id);
    showAlert(`Application declined for ${name}.`);
  };

  const handleCall = (phone: string, name: string) => {
    showAlert(`Initiating secure command desk phone call to ${name} (${phone})...`);
  };

  const handleSms = (name: string) => {
    showAlert(`Automated briefing SMS dispatched to ${name}.`);
  };

  const filteredApplicants = applicants.filter((app) => {
    if (filterType === 'all') return true;
    if (filterType === 'medical') return app.specializationType === 'medical';
    if (filterType === 'vehicle') return app.specializationType === 'vehicle';
    return true;
  });

  return (
    <section
      className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/60 shadow-sm space-y-4"
      id="volunteer-queue"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">how_to_reg</span>
            <h2 className="font-heading font-bold text-base text-on-surface">
              Volunteer Intake &amp; Direct Contact Console
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Live sync from public intake portal: Direct admin voice call, SMS dispatch, and field allocation without intermediaries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            className={`px-3.5 py-1.5 rounded-full border border-outline-variant text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-surface-container-highest text-on-surface'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
            onClick={() => setFilterType(filterType === 'all' ? 'medical' : 'all')}
            type="button"
          >
            {filterType === 'all' ? 'Filter: Paramedic & Drivers' : 'Showing: Paramedic Only'}
          </button>
          <button
            className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container transition-colors shadow-sm"
            onClick={() => showAlert('Bulk SMS broadcast dispatched to all 34 pending volunteers.')}
            type="button"
          >
            Bulk SMS Broadcast
          </button>
        </div>
      </div>

      {alertMessage && (
        <div className="p-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-xs font-medium flex items-center justify-between">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant/50 bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant text-[11px] font-bold border-b border-outline-variant/60">
              <th className="py-3 px-4">Applicant &amp; Verified ID</th>
              <th className="py-3 px-4">Specialization</th>
              <th className="py-3 px-4">Sector / District Availability</th>
              <th className="py-3 px-4">Verification State</th>
              <th className="py-3 px-4 text-right">Instant Action Bar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-xs">
            {filteredApplicants.map((app) => (
              <tr key={app.id} className="hover:bg-surface-container-low/70 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-on-surface">{app.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-outline">
                    <span>{app.phone}</span>
                    <span>•</span>
                    <span className="text-primary font-mono font-medium">{app.govId}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      app.specializationType === 'medical'
                        ? 'bg-error-container text-on-error-container'
                        : app.specializationType === 'vehicle'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                  >
                    {app.specializationType === 'medical' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    )}
                    {app.specializationType === 'vehicle' && (
                      <span className="material-symbols-outlined text-[14px]">minor_crash</span>
                    )}
                    {app.specializationType === 'radio' && (
                      <span className="material-symbols-outlined text-[14px]">radio</span>
                    )}
                    <span>{app.specialization}</span>
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-on-surface">{app.sector}</div>
                  <div className="text-[11px] text-outline">{app.availability}</div>
                </td>

                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 text-primary text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>{app.verificationBadge}</span>
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="p-2 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary transition-all active:scale-95 border border-outline-variant"
                      onClick={() => handleCall(app.phone, app.name)}
                      title="Direct Phone Call from Admin Desk"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </button>
                    <button
                      className="p-2 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary transition-all active:scale-95 border border-outline-variant"
                      onClick={() => handleSms(app.name)}
                      title="Dispatch Automated Briefing SMS"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">sms</span>
                    </button>
                    {app.status === 'approved' ? (
                      <span className="px-3 py-1.5 rounded-full bg-[#2e7d32]/20 text-[#1b5e20] text-[11px] font-bold">
                        Deployed
                      </span>
                    ) : app.status === 'rejected' ? (
                      <span className="px-3 py-1.5 rounded-full bg-error-container text-error text-[11px] font-bold">
                        Declined
                      </span>
                    ) : (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-heading font-bold hover:bg-primary-container transition-all active:scale-95 shadow-sm"
                          onClick={() => handleApprove(app.id, app.name)}
                          type="button"
                        >
                          Approve &amp; Deploy
                        </button>
                        <button
                          className="p-2 rounded-full hover:bg-error-container text-outline hover:text-error transition-all"
                          onClick={() => handleReject(app.id, app.name)}
                          title="Reject application"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminVolunteerConsole;
