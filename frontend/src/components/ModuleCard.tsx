'use client';

import { LucideIcon } from 'lucide-react';

type RiskLevel = 'secure' | 'warning' | 'critical';

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  status: RiskLevel;
  findings?: number;
  details?: string[];
  comingSoon?: boolean;
}

export default function ModuleCard({
  icon: Icon,
  title,
  status,
  findings = 0,
  details = [],
  comingSoon = false
}: ModuleCardProps) {
  const statusConfig = {
    secure: {
      label: 'Secure',
      className: 'badge-secure'
    },
    warning: {
      label: 'Warning',
      className: 'badge-warning'
    },
    critical: {
      label: 'Critical',
      className: 'badge-critical'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="module-card relative">
      {comingSoon && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center z-10">
          <span className="badge badge-info">Coming Soon</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <Icon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {findings > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{findings} findings detected</p>
            )}
          </div>
        </div>

        <span className={`badge ${config.className}`}>
          {config.label}
        </span>
      </div>

      {details.length > 0 && (
        <div className="space-y-2">
          {details.map((detail, idx) => (
            <div
              key={idx}
              className="text-xs text-slate-300 bg-slate-950/50 px-3 py-2.5 rounded-lg border border-slate-800/60"
            >
              {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
