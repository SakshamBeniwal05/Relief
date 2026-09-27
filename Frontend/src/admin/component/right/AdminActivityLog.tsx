import React from 'react';
import type { ActivityLogItem } from '../../types';

interface AdminActivityLogProps {
  logs: ActivityLogItem[];
  onViewComprehensiveAudit?: () => void;
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({
  logs,
  onViewComprehensiveAudit,
}) => {
  return (
    <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/60 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-base text-on-surface">Administrative Activity Log</h3>
          <span className="text-[11px] font-mono text-outline">Real-Time Mesh Feed</span>
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full ${log.iconBg} ${log.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
              >
                <span className="material-symbols-outlined text-[16px]">{log.icon}</span>
              </div>
              <div className="text-xs">
                <div className="font-bold text-on-surface leading-tight">{log.title}</div>
                <div className="text-[10px] text-outline">{log.authInfo}</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">{log.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/50 flex items-center justify-between">
        <span className="text-[11px] text-outline">Total 142 events logged today</span>
        <button
          className="text-[11px] text-primary font-bold hover:underline"
          onClick={onViewComprehensiveAudit || (() => alert('Opening full cryptographic audit trail...'))}
          type="button"
        >
          View Comprehensive Audit
        </button>
      </div>
    </div>
  );
};

export default AdminActivityLog;
