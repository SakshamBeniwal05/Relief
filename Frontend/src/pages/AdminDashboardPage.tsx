import React, { useState, useEffect } from 'react';
import {
  AdminNavbar,
  AdminSideNav,
  CommanderHeaderStrip,
  AdminHeroStats,
  AdminActivityLog,
  AdminSosDirectives,
  AdminVolunteerConsole,
  AdminGeocamQueue,
  ADMIN_HERO_STATS,
  INITIAL_APPLICANTS,
  INITIAL_INCIDENTS,
  ADMIN_ACTIVITY_LOGS,
} from '../admin';
import type {
  HeroStatMetric,
  VolunteerApplicant,
  GeoIncident,
  ActivityLogItem,
} from '../admin';
import {
  fetchAdminStats,
  fetchVolunteerApplicants,
  updateVolunteerStatus,
  fetchGeoIncidents,
  updateIncidentStatus,
  issueGazetteDirective,
  broadcastEmergencyThreatAlert,
  fetchActivityLogs,
} from '../services/api';
import { initWebSocketConnection } from '../services/websocket';

interface AdminDashboardPageProps {
  onSwitchToUserMap?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onSwitchToUserMap,
}) => {
  const [activeNavTab, setActiveNavTab] = useState<string>('resettlement-queues');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [stats, setStats] = useState<HeroStatMetric[]>(ADMIN_HERO_STATS);
  const [applicants, setApplicants] = useState<VolunteerApplicant[]>(INITIAL_APPLICANTS);
  const [incidents, setIncidents] = useState<GeoIncident[]>(INITIAL_INCIDENTS);
  const [logs, setLogs] = useState<ActivityLogItem[]>(ADMIN_ACTIVITY_LOGS);

  useEffect(() => {
    initWebSocketConnection();
    fetchAdminStats().then((data) => {
      if (data && data.length > 0) setStats(data);
    });
    fetchVolunteerApplicants().then((data) => {
      if (data && data.length > 0) setApplicants(data);
    });
    fetchGeoIncidents().then((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    fetchActivityLogs().then((data) => {
      if (data && data.length > 0) setLogs(data);
    });
  }, []);

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-sans selection:bg-secondary-container selection:text-primary">
      {/* 1. Top Navigation Bar */}
      <AdminNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeNavTab="relocation-lifelines"
        onSelectNavTab={(tab) => {
          if (tab === 'threat-radar' && onSwitchToUserMap) {
            onSwitchToUserMap();
          }
        }}
        onSwitchToUserMap={onSwitchToUserMap}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left SideNav */}
        <AdminSideNav
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          onOpenVolunteerApply={() => alert('Direct volunteer dispatch window opened.')}
        />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8 space-y-6 custom-scrollbar h-[calc(100vh-4rem)]">
          {/* SECTION 1: TOP HUD COMMANDER BADGE & TELEMETRY STRIP */}
          <CommanderHeaderStrip onSwitchToMapHud={onSwitchToUserMap} />

          {/* SECTION 2: HERO STAT CARDS (4-Column Bento Metric Ribbon) */}
          <AdminHeroStats stats={stats} />

          {/* SECTION 3: VOLUNTEER MANAGEMENT & INTAKE QUEUE */}
          <AdminVolunteerConsole
            initialApplicants={applicants}
            onApprove={(id) => updateVolunteerStatus(id, 'approved')}
            onReject={(id) => updateVolunteerStatus(id, 'rejected')}
          />

          {/* SECTION 4: ANTI-PRANK GEO-CAM INCIDENT VERIFICATION QUEUE */}
          <AdminGeocamQueue
            initialIncidents={incidents}
            onVerifyAndPushMap={(id) => updateIncidentStatus(id, 'verified')}
            onEscalateSdrf={(id) => updateIncidentStatus(id, 'escalated')}
          />

          {/* SECTION 5: ADMINISTRATIVE GAZETTE & RELOCATION MANAGEMENT CONTROLS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <AdminSosDirectives
                onBroadcastDirective={(payload) => issueGazetteDirective(payload)}
                onBroadcastAlert={(payload) => broadcastEmergencyThreatAlert(payload)}
              />
            </div>
            <div className="lg:col-span-5">
              <AdminActivityLog logs={logs} />
            </div>
          </section>

          {/* Bottom System Telemetry Ribbon */}
          <footer className="pt-4 pb-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between text-xs text-outline gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span>SIH26191 Relife Command Engine v4.2.1 • National Disaster Management Authority</span>
            </div>
            <div>
              Encrypted Gov-Mesh Protocol • Uttarakhand State Disaster Response Force (SDRF)
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
