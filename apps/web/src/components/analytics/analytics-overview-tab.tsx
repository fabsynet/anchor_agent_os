'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Shield,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { OverviewStats, PolicyBreakdown } from '@anchor/shared';

import { api } from '@/lib/api';
import { exportToCsv, exportToPdf } from '@/lib/export-utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from './chart-card';
import { ExportButtons } from './export-buttons';

const CHART_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#ea580c', // orange-600
  '#8b5cf6', // violet-500
  '#e11d48', // rose-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
  '#6d28d9', // violet-700
  '#059669', // emerald-600
  '#dc2626', // red-600
];

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface AnalyticsOverviewTabProps {
  startDate?: string;
  endDate?: string;
}

function CustomTooltipContent({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium capitalize">{item.name}</p>
        <p className="text-muted-foreground">
          {item.payload.count} {item.payload.count === 1 ? 'policy' : 'policies'}
        </p>
        <p className="text-muted-foreground">
          {currencyFormatter.format(item.value)}
        </p>
      </div>
    );
  }
  return null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverviewTab({
  startDate,
  endDate,
}: AnalyticsOverviewTabProps) {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [breakdown, setBreakdown] = useState<PolicyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const qs = params.toString() ? `?${params.toString()}` : '';

        const [overviewData, breakdownData] = await Promise.all([
          api.get<OverviewStats>(`/api/analytics/overview${qs}`),
          api.get<PolicyBreakdown[]>(`/api/analytics/policy-breakdown${qs}`),
        ]);

        if (!cancelled) {
          setOverview(overviewData);
          setBreakdown(breakdownData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load overview data',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  // Prepare chart data (memoized to avoid re-computation on re-renders)
  const chartData = useMemo(
    () =>
      breakdown
        .filter((b) => b.totalPremium > 0 || b.count > 0)
        .map((b) => ({
          name: b.type.charAt(0).toUpperCase() + b.type.slice(1),
          value: b.totalPremium,
          count: b.count,
        })),
    [breakdown],
  );

  const totalPremium = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );

  const handleExportCsv = async () => {
    if (!overview) return;

    const overviewRows = [
      {
        Metric: 'Total Clients',
        Value: overview.totalClients,
      },
      {
        Metric: 'Active Policies',
        Value: overview.activePolicies,
      },
      {
        Metric: 'Total Premium YTD',
        Value: overview.totalPremiumYtd,
      },
      {
        Metric: 'Renewal Rate',
        Value: `${overview.renewalRate}%`,
      },
    ];

    const breakdownRows = breakdown.map((b) => ({
      Type: b.type,
      Count: b.count,
      'Total Premium': b.totalPremium,
    }));

    await exportToCsv(
      [...overviewRows, {}, ...breakdownRows] as Record<string, unknown>[],
      'analytics-overview',
    );
  };

  const handleExportPdf = async () => {
    if (!overview) return;

    const rows: (string | number)[][] = [
      ['Total Clients', overview.totalClients],
      ['Active Policies', overview.activePolicies],
      ['Total Premium YTD', currencyFormatter.format(overview.totalPremiumYtd)],
      ['Renewal Rate', `${overview.renewalRate}%`],
      ['', ''],
      ...breakdown.map((b) => [
        b.type,
        b.count,
        currencyFormatter.format(b.totalPremium),
      ]),
    ];

    await exportToPdf(
      'Analytics Overview',
      ['Metric', 'Value', 'Premium'],
      rows,
      'analytics-overview',
    );
  };

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={overview?.totalClients ?? 0}
          icon={<Users className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="Active Policies"
          value={overview?.activePolicies ?? 0}
          icon={<Shield className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="Total Premium YTD"
          value={
            overview
              ? currencyFormatter.format(overview.totalPremiumYtd)
              : '$0'
          }
          icon={<DollarSign className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="Renewal Rate"
          value={overview ? `${overview.renewalRate}%` : '0%'}
          icon={<TrendingUp className="size-5" />}
          loading={loading}
        />
      </div>

      {/* Policy Breakdown Chart */}
      <div className="flex items-center justify-between">
        <div />
        <ExportButtons
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          loading={loading}
        />
      </div>

      {loading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : chartData.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No policy data for the selected period
        </div>
      ) : (
        <ChartCard
          title="Policy Type Distribution"
          description="Breakdown of policies by type with premium totals"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-lg font-bold"
                          >
                            {currencyFormatter.format(totalPremium)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 14}
                            className="fill-muted-foreground text-xs"
                          >
                            Total Premium
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
              <Tooltip content={<CustomTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor:
                      CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="text-muted-foreground">
                  {item.name} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
