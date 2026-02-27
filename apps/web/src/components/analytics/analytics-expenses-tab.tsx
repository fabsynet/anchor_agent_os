'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  Gauge,
  Receipt,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ExpenseSummary } from '@anchor/shared';

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

interface AnalyticsExpensesTabProps {
  startDate?: string;
  endDate?: string;
}

function DonutTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium capitalize">{item.name}</p>
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
  value: string;
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

export function AnalyticsExpensesTab({
  startDate,
  endDate,
}: AnalyticsExpensesTabProps) {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
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

        const data = await api.get<ExpenseSummary>(
          `/api/analytics/expense-summary${qs}`,
        );
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load expense summary',
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

  // Chart data for donut (memoized to avoid re-computation on re-renders)
  const chartData = useMemo(
    () =>
      (summary?.byCategory ?? [])
        .filter((c) => c.amount > 0)
        .map((c) => ({
          name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
          value: c.amount,
        })),
    [summary],
  );

  const totalExpenses = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );

  const handleExportCsv = async () => {
    if (!summary) return;
    const rows = [
      { Metric: 'Total Approved', Value: summary.totalApproved },
      { Metric: 'Total Pending', Value: summary.totalPending },
      {
        Metric: 'Budget Usage',
        Value:
          summary.budgetUsage !== null
            ? `${summary.budgetUsage}%`
            : 'No budget set',
      },
      {},
      ...summary.byCategory.map((c) => ({
        Category: c.category,
        Amount: c.amount,
      })),
    ];
    await exportToCsv(
      rows as Record<string, unknown>[],
      'analytics-expenses',
    );
  };

  const handleExportPdf = async () => {
    if (!summary) return;
    const rows: (string | number)[][] = [
      [
        'Total Approved',
        currencyFormatter.format(summary.totalApproved),
      ],
      [
        'Total Pending',
        currencyFormatter.format(summary.totalPending),
      ],
      [
        'Budget Usage',
        summary.budgetUsage !== null
          ? `${summary.budgetUsage}%`
          : 'No budget set',
      ],
      ['', ''],
      ...summary.byCategory.map((c) => [
        c.category,
        currencyFormatter.format(c.amount),
      ]),
    ];
    await exportToPdf(
      'Expense Summary',
      ['Metric / Category', 'Value'],
      rows,
      'analytics-expenses',
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Receipt className="mx-auto mb-3 size-10 opacity-40" />
        No expense data for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Approved"
          value={currencyFormatter.format(summary.totalApproved)}
          icon={<DollarSign className="size-5" />}
          loading={false}
        />
        <StatCard
          title="Total Pending"
          value={currencyFormatter.format(summary.totalPending)}
          icon={<Clock className="size-5" />}
          loading={false}
        />
        <StatCard
          title="Budget Usage"
          value={
            summary.budgetUsage !== null
              ? `${summary.budgetUsage}%`
              : 'No budget set'
          }
          icon={<Gauge className="size-5" />}
          loading={false}
        />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <ExportButtons
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          loading={loading}
        />
      </div>

      {/* Expense by Category Donut Chart */}
      {chartData.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No expense categories for the selected period
        </div>
      ) : (
        <ChartCard
          title="Expenses by Category"
          description="Breakdown of approved expenses by category"
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
                            className="fill-foreground text-lg font-bold"
                          >
                            {currencyFormatter.format(totalExpenses)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 14}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
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
            {chartData.map((item, index) => (
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
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Category Breakdown Table */}
      {summary.byCategory.length > 0 && (
        <ChartCard
          title="Category Details"
          description="Expense totals by category"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.byCategory
                  .filter((c) => c.amount > 0)
                  .sort((a, b) => b.amount - a.amount)
                  .map((c) => (
                    <tr key={c.category} className="border-b last:border-0">
                      <td className="py-2 capitalize">{c.category}</td>
                      <td className="py-2 text-right">
                        {currencyFormatter.format(c.amount)}
                      </td>
                      <td className="py-2 text-right">
                        {totalExpenses > 0
                          ? `${((c.amount / totalExpenses) * 100).toFixed(1)}%`
                          : '0%'}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right">
                    {currencyFormatter.format(totalExpenses)}
                  </td>
                  <td className="pt-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
