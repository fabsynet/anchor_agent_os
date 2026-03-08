'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface EngagementChartProps {
  activeAgencies: number;
  inactiveAgencies: number;
}

export function EngagementChart({ activeAgencies, inactiveAgencies }: EngagementChartProps) {
  const data = [
    { name: 'Active', count: activeAgencies },
    { name: 'Inactive', count: inactiveAgencies },
  ];

  const colors = ['#22c55e', '#ef4444'];

  if (activeAgencies === 0 && inactiveAgencies === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b]">
        <p className="text-sm text-[#64748b]">No engagement data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6">
      <h3 className="mb-4 text-sm font-semibold text-white">Agency Engagement</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            allowDecimals={false}
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
          <Bar dataKey="count" name="Agencies" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EngagementChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#334155] bg-[#1e293b] p-6">
      <div className="mb-4 h-4 w-36 rounded bg-[#334155]" />
      <div className="h-[300px] rounded bg-[#0f172a]" />
    </div>
  );
}
