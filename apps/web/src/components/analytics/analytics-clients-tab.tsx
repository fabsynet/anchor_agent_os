'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, UserSearch } from 'lucide-react';
import type { ClientStats } from '@anchor/shared';

import { api } from '@/lib/api';
import { exportToCsv, exportToPdf } from '@/lib/export-utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButtons } from './export-buttons';

interface AnalyticsClientsTabProps {
  startDate?: string;
  endDate?: string;
}

interface StatCardProps {
  title: string;
  value: number;
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
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsClientsTab({
  startDate,
  endDate,
}: AnalyticsClientsTabProps) {
  const [stats, setStats] = useState<ClientStats | null>(null);
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

        const data = await api.get<ClientStats>(
          `/api/analytics/client-stats${qs}`,
        );
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load client stats',
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

  const handleExportCsv = async () => {
    if (!stats) return;
    await exportToCsv(
      [
        { Metric: 'Total Clients', Value: stats.totalClients },
        { Metric: 'Active Clients', Value: stats.activeClients },
        { Metric: 'Leads', Value: stats.leads },
        { Metric: 'New This Period', Value: stats.newThisPeriod },
      ],
      'analytics-clients',
    );
  };

  const handleExportPdf = async () => {
    if (!stats) return;
    await exportToPdf(
      'Client Analytics',
      ['Metric', 'Value'],
      [
        ['Total Clients', stats.totalClients],
        ['Active Clients', stats.activeClients],
        ['Leads', stats.leads],
        ['New This Period', stats.newThisPeriod],
      ],
      'analytics-clients',
    );
  };

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats?.totalClients ?? 0}
          icon={<Users className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="Active Clients"
          value={stats?.activeClients ?? 0}
          icon={<UserCheck className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="Leads"
          value={stats?.leads ?? 0}
          icon={<UserSearch className="size-5" />}
          loading={loading}
        />
        <StatCard
          title="New This Period"
          value={stats?.newThisPeriod ?? 0}
          icon={<UserPlus className="size-5" />}
          loading={loading}
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

      {/* Empty state */}
      {!loading && stats && stats.totalClients === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No client data for the selected period
        </div>
      )}
    </div>
  );
}
