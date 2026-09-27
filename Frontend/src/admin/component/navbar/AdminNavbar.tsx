import React from 'react';

interface AdminNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
  onSwitchToUserMap?: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  searchQuery,
  onSearchChange,
  activeNavTab = 'relocation-lifelines',
  onSelectNavTab,
  onSwitchToUserMap,
}) => {
  return (
    <header className="w-full h-16 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 backdrop-blur-md bg-surface/95 z-50 shadow-sm border-b border-outline-variant/40">
      {/* Left Section: Search and Brand Name */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined">policy</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-heading font-bold text-primary tracking-wide leading-tight">
              UK-DISCOM NDRF
            </span>
            <span className="text-[10px] font-mono text-outline tracking-wider">
              SIH26191 CRITICAL OPERATIONS
            </span>
          </div>
        </div>

        {/* Search Bar on Left */}
        <div className="relative w-full max-w-sm hidden md:block">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-full border border-outline-variant text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline text-on-surface"
            placeholder="Search Aadhaar, Node ID, Camp Grid..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden lg:flex items-center gap-2">
        <button
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-heading font-bold transition-all ${
            activeNavTab === 'threat-radar'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
          }`}
          onClick={() => {
            if (onSwitchToUserMap) onSwitchToUserMap();
            else if (onSelectNavTab) onSelectNavTab('threat-radar');
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">radar</span>
          <span>Threat Radar</span>
        </button>

        <button
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-heading font-bold transition-all ${
            activeNavTab === 'relocation-lifelines'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
          }`}
          onClick={() => onSelectNavTab && onSelectNavTab('relocation-lifelines')}
          type="button"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            crisis_alert
          </span>
          <span>Relocation &amp; Lifelines</span>
        </button>
      </nav>

      {/* Trailing Action Badges & Commander Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold shadow-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-error"></span>
          <span>DEFCON 2 CRITICAL</span>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold border border-outline-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">sensors</span>
          <span>BLE MESH ONLINE</span>
        </div>

        {/* Trailing Icon Actions */}
        <div className="flex items-center gap-1 text-on-surface-variant">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95"
            title="Satellite Telemetry"
            type="button"
            onClick={() => alert('Satellite INSAT-3DR Telemetry Stream: Latency 140ms, Nominal.')}
          >
            <span className="material-symbols-outlined text-[20px]">satellite_alt</span>
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95"
            title="Sensor Nodes"
            type="button"
            onClick={() => alert('BLE Mesh Nodes: 148 Relays active in Chamoli basin.')}
          >
            <span className="material-symbols-outlined text-[20px]">sensors</span>
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors active:scale-95"
            title="Critical Warnings"
            type="button"
            onClick={() => alert('3 Active Critical Warnings: Joshimath, Pipalkoti, Helang.')}
          >
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </button>
        </div>

        {/* Profile Avatar Container */}
        <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
          <img
            alt="Col. Rajeshwar Sharma"
            className="w-9 h-9 rounded-full object-cover border-2 border-primary-container"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2nO0gRraWdDNp663AWNyjeQjYbLeyHr1bkgijo71CzYTZO1Y84AgTW-6DoORd-El_yNdV61TWw7dR3DpwLK4Z3OGwedrcNeUY8III-SBaknhQpn9h2yz8AxNoHueACGVWiMTjj5hANTPWgbulA8_AymJy-IZgDjiG3dNjnp2i8QxxHfRlHFKs7HpN4Kt1j_xjvo3ju97OqKk4Pe2wIIZ8BKqnbVgZsu_cXwQ2pkkUZjPftCoZ0Vc"
          />
          <div className="hidden 2xl:flex flex-col text-left">
            <span className="text-xs font-bold text-on-surface leading-tight">Col. R. Sharma</span>
            <span className="text-[10px] text-outline font-mono">Sector 4 Nodal</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
