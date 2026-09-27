import React from 'react';
import type { HeroStatMetric } from '../../types';

interface AdminHeroStatsProps {
  stats: HeroStatMetric[];
  onStatActionClick?: (statTitle: string) => void;
}

export const AdminHeroStats: React.FC<AdminHeroStatsProps> = ({
  stats,
  onStatActionClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-surface-container rounded-2xl p-5 border border-outline-variant/60 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold text-on-surface-variant">
              {stat.title}
            </span>
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-on-surface leading-tight">
                {stat.value}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  stat.badgeType === 'error'
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {stat.badge}
              </span>
            </div>
            <p className="text-xs text-outline mt-1">{stat.subtitle}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/50 flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant">{stat.footerText}</span>
            {stat.actionText && (
              <button
                className="text-[11px] text-primary font-bold hover:underline"
                onClick={() => onStatActionClick && onStatActionClick(stat.title)}
                type="button"
              >
                {stat.actionText}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminHeroStats;
