'use client';

import { useEffect, useState } from 'react';
import { Activity, ClipboardList } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ComplianceSummary } from '@anchor/shared';

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

interface AnalyticsComplianceTabProps {
  startDate?: string;
  endDate?: string;
}

function HorizontalBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {payload[0].value} {payload[0].value === 1 ? 'event' : 'events'}
        </p>
      </div>
    );
  }
  return null;
}

export function AnalyticsComplianceTab({
  startDate,
  endDate,
}: AnalyticsComplianceTabProps) {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
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

        const data = await api.get<ComplianceSummary>(
          `/api/analytics/compliance-summary${qs}`,
        );
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load compliance summary',
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

  // Chart data for horizontal bar chart
  const byTypeData = (summary?.byType ?? [])
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((t) => ({
      name: t.type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      count: t.count,
    }));

  // Per-user data sorted by count desc
  const byUserData = (summary?.byUser ?? [])
    .filter((u) => u.count > 0)
    .sort((a, b) => b.count - a.count);

  const handleExportCsv = async () => {
    if (!summary) return;
    const rows = [
      { Metric: 'Total Events', Value: summary.totalEvents },
      {},
      ...summary.byType.map((t) => ({
        'Event Type': t.type,
        Count: t.count,
      })),
      {},
      ...summary.byUser.map((u) => ({
        User: u.userName,
        'Activity Count': u.count,
      })),
    ];
    await exportToCsv(
      rows as Record<string, unknown>[],
      'analytics-compliance',
    );
  };

  const handleExportPdf = async () => {
    if (!summary) return;
    const rows: (string | number)[][] = [
      ['Total Events', summary.totalEvents],
      ['', ''],
      ...summary.byType.map((t) => [t.type, t.count]),
      ['', ''],
      ...summary.byUser.map((u) => [u.userName, u.count]),
    ];
    await exportToPdf(
      'Compliance Summary',
      ['Metric / Name', 'Value / Count'],
      rows,
      'analytics-compliance',
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
        <Skeleton className="h-24 w-48" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (!summary || summary.totalEvents === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <ClipboardList className="mx-auto mb-3 size-10 opacity-40" />
        No compliance events for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Events Stat Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <div className="text-muted-foreground">
              <Activity className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalEvents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <ExportButtons
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          loading={loading}
        />
      </div>

      {/* Activity Events by Type - Horizontal Bar Chart */}
      {byTypeData.length > 0 && (
        <ChartCard
          title="Events by Type"
          description="Activity event counts by type"
        >
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, byTypeData.length * 40 + 40)}
          >
            <BarChart
              data={byTypeData}
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
                allowDecimals={false}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                className="text-xs"
                tickLine={false}
              />
              <Tooltip content={<HorizontalBarTooltip />} />
              <Bar
                dataKey="count"
                fill="hsl(var(--chart-1))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Per-User Activity Summary Table */}
      {byUserData.length > 0 && (
        <ChartCard
          title="Activity by User"
          description="Events per user, sorted by activity"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    Events
                  </th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {byUserData.map((u) => (
                  <tr key={u.userId} className="border-b last:border-0">
                    <td className="py-2">{u.userName}</td>
                    <td className="py-2 text-right">{u.count}</td>
                    <td className="py-2 text-right">
                      {summary.totalEvents > 0
                        ? `${((u.count / summary.totalEvents) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right">{summary.totalEvents}</td>
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
