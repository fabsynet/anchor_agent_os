'use client';

import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#94a3b8]">{title}</p>
        <div className="rounded-lg bg-[#2563eb]/10 p-2">
          <Icon className="h-5 w-5 text-[#2563eb]" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      {trend && (
        <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
      {subtitle && !trend && (
        <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p>
      )}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-[#334155]" />
        <div className="h-9 w-9 rounded-lg bg-[#334155]" />
      </div>
      <div className="mt-3 h-8 w-20 rounded bg-[#334155]" />
      <div className="mt-1 h-3 w-16 rounded bg-[#334155]" />
    </div>
  );
}
