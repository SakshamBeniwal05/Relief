import React, { useState } from 'react';
import { UserMapHudPage, AdminDashboardPage } from './pages';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'user' | 'admin'>('user');

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Active Page View */}
      {activeView === 'user' ? (
        <UserMapHudPage />
      ) : (
        <AdminDashboardPage onSwitchToUserMap={() => setActiveView('user')} />
      )}

      {/* Floating Global Switcher (Allows instant toggle between User & Admin views) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant shadow-2xl">
          <button
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-heading font-bold  transition-all duration-300 ${
              activeView === 'user'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveView('user')}
            type="button"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: activeView === 'user' ? "'FILL' 1" : "'FILL' 0" }}
            >
              map
            </span>
            <span>User Map HUD</span>
          </button>

          <button
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all ${
              activeView === 'admin'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveView('admin')}
            type="button"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: activeView === 'admin' ? "'FILL' 1" : "'FILL' 0" }}
            >
              admin_panel_settings
            </span>
            <span>Admin Command Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;