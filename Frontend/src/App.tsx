import React, { useState, useEffect } from 'react';
import { UserMapHudPage, AdminDashboardPage } from './pages';
import { BroadcastAlertModal, type EmergencyBroadcastAlert } from './user';
import { initWebSocketConnection } from './services/websocket';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'user' | 'admin'>('user');
  const [activeAlert, setActiveAlert] = useState<EmergencyBroadcastAlert | null>(null);
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: 30.556,
    lng: 79.563,
  });

  useEffect(() => {
    // 1. Initialize real-time WebSocket & peer BroadcastChannel at root application level
    initWebSocketConnection();

    // 2. Read live GPS if permitted, fallback to Joshimath command base
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        undefined,
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
      );
    }

    // 3. Listen for emergency alerts across WebSockets, BroadcastChannel, and local dispatches
    const handleEmergencyAlert = (e: any) => {
      if (e.detail) {
        console.log('🚨 [Global App] Activating Emergency Broadcast Alert:', e.detail);
        setActiveAlert(e.detail);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'sih_latest_broadcast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setActiveAlert(parsed);
        } catch (err) {
          // ignore
        }
      }
    };

    window.addEventListener('sih-emergency-alert', handleEmergencyAlert);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('sih-emergency-alert', handleEmergencyAlert);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Active Page View */}
      {activeView === 'user' ? (
        <UserMapHudPage />
      ) : (
        <AdminDashboardPage onSwitchToUserMap={() => setActiveView('user')} />
      )}

      {/* Global Location-Aware Emergency Broadcast Alert Modal */}
      {/* Renders across both User Map HUD and Admin Command Center views */}
      <BroadcastAlertModal
        alert={activeAlert}
        userCoords={userGpsCoords}
        onClose={() => setActiveAlert(null)}
        onNavigateToShelter={() => {
          setActiveView('user');
          setActiveAlert(null);
        }}
      />

      {/* Floating Global Switcher (Allows instant toggle between User & Admin views) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[1] pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant shadow-2xl">
          <button
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all duration-300 ${
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