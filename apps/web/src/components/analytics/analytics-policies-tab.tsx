'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Label,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PolicyBreakdown } from '@anchor/shared';

import { api } from '@/lib/api';
import { exportToCsv, exportToPdf } from '@/lib/export-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from './chart-card';
import { ExportButtons } from './export-buttons';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface AnalyticsPoliciesTabProps {
  startDate?: string;
  endDate?: string;
}

interface PremiumByProduct {
  type: string;
  customType: string | null;
  count: number;
  totalPremium: number;
}

function DonutTooltip({ active, payload }: any) {
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

function BarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium capitalize">{label}</p>
        <p className="text-muted-foreground">
          {currencyFormatter.format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export function AnalyticsPoliciesTab({
  startDate,
  endDate,
}: AnalyticsPoliciesTabProps) {
  const [breakdown, setBreakdown] = useState<PolicyBreakdown[]>([]);
  const [premiumByProduct, setPremiumByProduct] = useState<PremiumByProduct[]>(
    [],
  );
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

        const [breakdownData, premiumData] = await Promise.all([
          api.get<PolicyBreakdown[]>(`/api/analytics/policy-breakdown${qs}`),
          api.get<PremiumByProduct[]>(`/api/analytics/premium-by-product${qs}`),
        ]);

        if (!cancelled) {
          setBreakdown(breakdownData);
          setPremiumByProduct(premiumData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load policy analytics',
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

  // Chart data for donut
  const donutData = breakdown
    .filter((b) => b.count > 0)
    .map((b) => ({
      name: b.type.charAt(0).toUpperCase() + b.type.slice(1),
      value: b.totalPremium,
      count: b.count,
    }));

  const totalPolicies = donutData.reduce((sum, d) => sum + d.count, 0);

  // Bar chart data
  const barData = premiumByProduct
    .filter((p) => p.totalPremium > 0)
    .map((p) => ({
      name:
        p.customType ||
        p.type.charAt(0).toUpperCase() + p.type.slice(1),
      premium: p.totalPremium,
    }))
    .sort((a, b) => b.premium - a.premium);

  const handleExportCsv = async () => {
    const rows = breakdown.map((b) => ({
      Type: b.type,
      Count: b.count,
      'Total Premium': b.totalPremium,
    }));
    await exportToCsv(rows, 'analytics-policies');
  };

  const handleExportPdf = async () => {
    await exportToPdf(
      'Policy Analytics',
      ['Type', 'Count', 'Total Premium'],
      breakdown.map((b) => [
        b.type,
        b.count,
        currencyFormatter.format(b.totalPremium),
      ]),
      'analytics-policies',
    );
  };

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">{error}</div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No policy data for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="flex justify-end">
        <ExportButtons
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Donut Chart */}
        <ChartCard
          title="Policy Type Distribution"
          description="Number of policies by type"
        >
          {donutData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (
                          viewBox &&
                          'cx' in viewBox &&
                          'cy' in viewBox
                        ) {
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
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalPolicies}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                className="fill-muted-foreground text-xs"
                              >
                                Policies
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {donutData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 text-sm"
                  >
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
            </>
          )}
        </ChartCard>

        {/* Premium Bar Chart */}
        <ChartCard
          title="Premium by Product Line"
          description="Total premium revenue by insurance product"
        >
          {barData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No premium data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => currencyFormatter.format(v)}
                  className="text-xs"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  className="text-xs capitalize"
                />
                <Tooltip content={<BarTooltip />} />
                <Bar
                  dataKey="premium"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Detail Table */}
      <ChartCard title="Policy Details" description="Complete breakdown by type">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="pb-2 text-right font-medium text-muted-foreground">
                  Count
                </th>
                <th className="pb-2 text-right font-medium text-muted-foreground">
                  Total Premium
                </th>
                <th className="pb-2 text-right font-medium text-muted-foreground">
                  Avg Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.type} className="border-b last:border-0">
                  <td className="py-2 capitalize">{b.type}</td>
                  <td className="py-2 text-right">{b.count}</td>
                  <td className="py-2 text-right">
                    {currencyFormatter.format(b.totalPremium)}
                  </td>
                  <td className="py-2 text-right">
                    {b.count > 0
                      ? currencyFormatter.format(b.totalPremium / b.count)
                      : '$0'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">
                  {breakdown.reduce((sum, b) => sum + b.count, 0)}
                </td>
                <td className="pt-2 text-right">
                  {currencyFormatter.format(
                    breakdown.reduce((sum, b) => sum + b.totalPremium, 0),
                  )}
                </td>
                <td className="pt-2 text-right" />
              </tr>
            </tfoot>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
