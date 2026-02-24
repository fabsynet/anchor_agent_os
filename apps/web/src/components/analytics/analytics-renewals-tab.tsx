'use client';

import { useEffect, useState, useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { RenewalPipelineMonth } from '@anchor/shared';

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

interface AnalyticsRenewalsTabProps {
  startDate?: string;
  endDate?: string;
}

function StackedBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="mb-1 font-medium">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-muted-foreground">
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface SummaryCardProps {
  title: string;
  value: number;
  color: string;
  loading: boolean;
}

function SummaryCard({ title, value, color, loading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className="size-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsRenewalsTab({
  startDate,
  endDate,
}: AnalyticsRenewalsTabProps) {
  const [pipeline, setPipeline] = useState<RenewalPipelineMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Renewal pipeline always shows last 12 months, no date params
        const data = await api.get<RenewalPipelineMonth[]>(
          '/api/analytics/renewal-pipeline',
        );
        if (!cancelled) setPipeline(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load renewal pipeline',
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

  // Compute totals (memoized)
  const totals = useMemo(
    () =>
      pipeline.reduce(
        (acc, month) => ({
          active: acc.active + month.active,
          expiring: acc.expiring + month.expiring,
          expired: acc.expired + month.expired,
        }),
        { active: 0, expiring: 0, expired: 0 },
      ),
    [pipeline],
  );

  const handleExportCsv = async () => {
    const rows = pipeline.map((m) => ({
      Month: m.month,
      Active: m.active,
      Expiring: m.expiring,
      Expired: m.expired,
    }));
    await exportToCsv(rows, 'analytics-renewals');
  };

  const handleExportPdf = async () => {
    await exportToPdf(
      'Renewal Pipeline',
      ['Month', 'Active', 'Expiring', 'Expired'],
      pipeline.map((m) => [m.month, m.active, m.expiring, m.expired]),
      'analytics-renewals',
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
        <Skeleton className="h-[350px]" />
      </div>
    );
  }

  if (pipeline.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <CalendarClock className="mx-auto mb-3 size-10 opacity-40" />
        No renewal pipeline data available
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

      {/* Stacked Bar Chart */}
      <ChartCard
        title="Renewal Pipeline"
        description="Monthly view of policy lifecycle status"
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={pipeline}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
            />
            <XAxis
              dataKey="month"
              className="text-xs"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<StackedBarTooltip />} />
            <Legend />
            <Bar
              dataKey="active"
              stackId="a"
              fill="hsl(var(--chart-1))"
              name="Active"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="expiring"
              stackId="a"
              fill="hsl(var(--chart-2))"
              name="Expiring"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="expired"
              stackId="a"
              fill="hsl(var(--chart-3))"
              name="Expired"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Active"
          value={totals.active}
          color="hsl(var(--chart-1))"
          loading={false}
        />
        <SummaryCard
          title="Total Expiring"
          value={totals.expiring}
          color="hsl(var(--chart-2))"
          loading={false}
        />
        <SummaryCard
          title="Total Expired"
          value={totals.expired}
          color="hsl(var(--chart-3))"
          loading={false}
        />
      </div>
    </div>
  );
}
