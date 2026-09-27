import React from 'react';

interface AdminSideNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenVolunteerApply?: () => void;
}

export const AdminSideNav: React.FC<AdminSideNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenVolunteerApply,
}) => {
  const navItems = [
    { id: 'directives', label: 'Directives & Orders', icon: 'policy' },
    { id: 'models', label: 'AI Threat Models', icon: 'troubleshoot' },
    { id: 'incidents', label: 'Incident Feeds', icon: 'crisis_alert', badge: '8', badgeType: 'error' },
    {
      id: 'resettlement',
      label: 'Resettlement Queues',
      icon: 'groups_3',
      badge: '34',
      badgeType: 'primary',
    },
    { id: 'transit-shelters', label: 'Transit Shelters', icon: 'night_shelter' },
    { id: 'gazettes', label: 'Gazette Timelines', icon: 'history_edu' },
  ];

  return (
    <aside className="hidden lg:flex flex-col justify-between p-4 h-[calc(100vh-4rem)] w-72 shrink-0 bg-surface-container-low shadow-md overflow-y-auto custom-scrollbar border-r border-outline-variant/40 z-40">
      {/* SideNav Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">shield</span>
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-on-surface leading-snug">
              Uttarakhand Command
            </h2>
            <p className="text-[11px] text-outline">Sector 4 Emergency Ops Center</p>
          </div>
        </div>

        {/* Navigation Tabs Cluster */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 rounded-full px-4 py-3 text-xs font-heading font-semibold transition-all active:scale-98 ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                onClick={() => onSelectTab(item.id)}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-primary' : ''
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeType === 'error'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="px-2 pt-2">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary-container text-on-primary text-xs font-heading font-bold shadow hover:bg-primary transition-all active:scale-95"
            onClick={onOpenVolunteerApply || (() => alert('Opening Emergency Volunteer Portal...'))}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Apply as Volunteer</span>
          </button>
        </div>
      </div>

      {/* SideNav Footer Tabs & Hardware status */}
      <div className="pt-6 border-t border-outline-variant/60 space-y-1">
        <button
          className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high rounded-full px-4 py-2.5 font-medium text-xs transition-all text-left"
          onClick={() => alert('BLE Mesh Diagnostics: 148 node relays active, packet loss < 0.1%.')}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            settings_input_antenna
          </span>
          <span>Mesh Diagnostics</span>
        </button>

        <button
          className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high rounded-full px-4 py-2.5 font-medium text-xs transition-all text-left"
          onClick={() => alert('Radio Dispatch Desk: Connected to 102.4 MHz Disaster Channel.')}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">cell_tower</span>
          <span>Radio Dispatch</span>
        </button>

        {/* Hardware System status indicator */}
        <div className="p-3 mt-3 bg-surface-container rounded-2xl border border-outline-variant/50">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-outline">Mesh Battery Hub</span>
            <span className="text-primary font-bold">94% Nominal</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full w-[94%]"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSideNav;
