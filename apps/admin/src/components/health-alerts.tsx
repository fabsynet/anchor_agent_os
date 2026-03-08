'use client';

import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';

/** Matches the actual backend HealthAlert shape from admin.service.ts */
export interface HealthAlertData {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  value?: number;
}

interface HealthAlertsProps {
  alerts: HealthAlertData[];
}

const severityConfig = {
  error: {
    icon: XCircle,
    bg: 'bg-red-900/20',
    border: 'border-red-800',
    text: 'text-red-400',
    badge: 'bg-red-900 text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-900/20',
    border: 'border-amber-800',
    text: 'text-amber-400',
    badge: 'bg-amber-900 text-amber-300',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-900/20',
    border: 'border-blue-800',
    text: 'text-blue-400',
    badge: 'bg-blue-900 text-blue-300',
  },
};

export function HealthAlerts({ alerts }: HealthAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-800 bg-emerald-900/20 p-4">
        <CheckCircle className="h-5 w-5 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-400">All systems healthy</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const config = severityConfig[alert.type] || severityConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-4`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.text}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                  {alert.type.toUpperCase()}
                </span>
                <span className="text-xs text-[#64748b]">{alert.category}</span>
              </div>
              <p className="mt-1 text-sm text-[#e2e8f0]">{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HealthAlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded bg-[#334155]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-[#334155]" />
              <div className="h-3 w-64 rounded bg-[#334155]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
