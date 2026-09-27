import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../api';
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
} from '../admin';
import { DistrictPredictionPanel } from '../admin/component/right/DistrictPredictionPanel';
import type { VolunteerApplicant, GeoIncident, ActivityLogItem, GazetteOrderPayload } from '../admin';

interface DashboardStats {
  pendingVolunteers: number;
  pendingIncidents: number;
  availableShelterBeds: number;
  activeDirectives: number;
}

interface ShelterSummary {
  totalBeds: number;
  occupiedBeds: number;
}

interface AdminDashboardPageProps {
  onSwitchToUserMap?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onSwitchToUserMap,
}) => {
  const [activeNavTab, setActiveNavTab] = useState<string>('resettlement-queues');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [applicants, setApplicants] = useState<VolunteerApplicant[]>([]);
  const [incidents, setIncidents] = useState<GeoIncident[]>([]);
  const [activity, setActivity] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ pendingVolunteers: 0, pendingIncidents: 0, availableShelterBeds: 0, activeDirectives: 0 });
  const [shelterSummary, setShelterSummary] = useState({ totalBeds: 0, occupiedBeds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    try {
      const [applicantData, incidentData, activityData, statsData, shelterData] = await Promise.all([
        apiRequest<VolunteerApplicant[]>('/admin/volunteers'),
        apiRequest<GeoIncident[]>('/admin/incidents'),
        apiRequest<ActivityLogItem[]>('/activity'),
        apiRequest<DashboardStats>('/admin/stats'),
        apiRequest<ShelterSummary[]>('/shelters'),
      ]);
      setApplicants(applicantData);
      setIncidents(incidentData.filter((incident) => incident.status !== 'dismissed'));
      setActivity(activityData);
      setStats(statsData);
      setShelterSummary({
        totalBeds: shelterData.reduce((total, shelter) => total + shelter.totalBeds, 0),
        occupiedBeds: shelterData.reduce((total, shelter) => total + shelter.occupiedBeds, 0),
      });
      setApiError(null);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not load command center data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void refreshDashboard(); }, 0);
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);
    const refreshEvents = ['volunteer:created', 'volunteer:updated', 'incident:created', 'incident:updated', 'directive:created', 'sos:received'];
    refreshEvents.forEach((event) => socket.on(event, refreshDashboard));
    return () => {
      window.clearTimeout(initialLoad);
      socket.disconnect();
    };
  }, [refreshDashboard]);

  const liveStats = ADMIN_HERO_STATS.map((stat) => {
    if (stat.title === 'Volunteer Applications') return { ...stat, value: String(stats.pendingVolunteers), badge: `${stats.pendingVolunteers} pending` };
    if (stat.title === 'Geo-Cam Citizen Triage') return { ...stat, value: String(stats.pendingIncidents), badge: 'Awaiting triage' };
    if (stat.title === 'Transit Camps Occupancy') {
      const occupancy = shelterSummary.totalBeds ? (shelterSummary.occupiedBeds / shelterSummary.totalBeds) * 100 : 0;
      return { ...stat, value: `${occupancy.toFixed(1)}%`, badge: `${stats.availableShelterBeds} beds free` };
    }
    return { ...stat, value: String(stats.activeDirectives), badge: 'Active orders' };
  });

  const updateVolunteerStatus = async (id: string, status: 'approved' | 'rejected') => {
    await apiRequest(`/admin/volunteers/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await refreshDashboard();
  };

  const updateIncidentStatus = async (id: string, status: 'verified' | 'escalated' | 'dismissed') => {
    await apiRequest(`/admin/incidents/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await refreshDashboard();
  };

  const publishDirective = async (payload: GazetteOrderPayload) => {
    await apiRequest('/admin/directives', { method: 'POST', body: JSON.stringify(payload) });
    await refreshDashboard();
  };

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
          <AdminHeroStats stats={liveStats} />

          {(apiError || isLoading) && (
            <div role={apiError ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs ${apiError ? 'border-error/30 bg-error-container text-on-error-container' : 'border-outline-variant bg-surface-container text-on-surface-variant'}`}>
              {apiError ? `Backend unavailable: ${apiError}` : 'Loading command center data...'}
              {apiError && <button className="ml-2 font-bold underline" onClick={() => void refreshDashboard()} type="button">Retry</button>}
            </div>
          )}

          <DistrictPredictionPanel />

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
            onDismiss={(id) => updateIncidentStatus(id, 'dismissed')}
          />

          {/* SECTION 5: ADMINISTRATIVE GAZETTE & RELOCATION MANAGEMENT CONTROLS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <AdminSosDirectives onBroadcastDirective={publishDirective} />
            </div>
            <div className="lg:col-span-5">
              <AdminActivityLog logs={activity} />
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
