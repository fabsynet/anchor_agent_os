'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PlatformGrowthPoint } from '@anchor/shared';

interface GrowthChartProps {
  data: PlatformGrowthPoint[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b]">
        <p className="text-sm text-[#64748b]">No growth data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6">
      <h3 className="mb-4 text-sm font-semibold text-white">Platform Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8' }} />
          <Line
            type="monotone"
            dataKey="agencies"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 4 }}
            name="Agencies"
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            name="Users"
          />
          <Line
            type="monotone"
            dataKey="clients"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ fill: '#a855f7', r: 4 }}
            name="Clients"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrowthChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-6">
      <div className="mb-4 h-4 w-32 rounded bg-[#334155]" />
      <div className="h-[300px] rounded bg-[#0f172a]" />
    </div>
  );
}
