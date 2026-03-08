'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Users,
  FileText,
  UserCheck,
  DollarSign,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import type { PlatformMetrics, PlatformGrowthPoint } from '@anchor/shared';
import { api } from '@/lib/api';
import { MetricCard, MetricCardSkeleton } from '@/components/charts/metric-card';
import { HealthAlerts, HealthAlertsSkeleton, type HealthAlertData } from '@/components/health-alerts';
import { TimeRangeSelector } from '@/components/time-range-selector';
import { GrowthChart, GrowthChartSkeleton } from '@/components/charts/growth-chart';
import { EngagementChart, EngagementChartSkeleton } from '@/components/charts/engagement-chart';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';

interface EngagementData {
  activeAgencies: number;
  inactiveAgencies: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [growth, setGrowth] = useState<PlatformGrowthPoint[] | null>(null);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlertData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [metricsData, growthData, engagementData, healthData] = await Promise.all([
          api.get<PlatformMetrics>('/admin/metrics'),
          api.get<PlatformGrowthPoint[]>('/admin/metrics/growth'),
          api.get<EngagementData>('/admin/metrics/engagement'),
          api.get<HealthAlertData[]>('/admin/health'),
        ]);

        setMetrics(metricsData);
        setGrowth(growthData);
        setEngagement(engagementData);
        setHealthAlerts(healthData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Refetch growth data on time range change
  const handleTimeRangeChange = useCallback(
    async (params: { startDate?: string; endDate?: string }) => {
      try {
        setGrowthLoading(true);
        let path = '/admin/metrics/growth';
        const queryParts: string[] = [];
        if (params.startDate) queryParts.push(`startDate=${params.startDate}`);
        if (params.endDate) queryParts.push(`endDate=${params.endDate}`);
        if (queryParts.length > 0) path += `?${queryParts.join('&')}`;

        const data = await api.get<PlatformGrowthPoint[]>(path);
        setGrowth(data);
      } catch {
        // Growth fetch failed silently, keep existing data
      } finally {
        setGrowthLoading(false);
      }
    },
    [],
  );

  // Export handlers
  async function handleExportCSV() {
    if (!metrics || !growth) return;
    const rows = growth.map((point) => ({
      Month: point.month,
      Agencies: point.agencies,
      Users: point.users,
      Clients: point.clients,
    }));
    await exportToCSV(rows, 'platform-growth');
  }

  async function handleExportPDF() {
    if (!metrics || !growth) return;
    const columns = ['Month', 'Agencies', 'Users', 'Clients'];
    const rows = growth.map((point) => [
      point.month,
      point.agencies,
      point.users,
      point.clients,
    ]);
    await exportToPDF('Platform Growth Report', columns, rows, 'platform-growth');
  }

  // Format large numbers
  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  }

  function formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  if (error && !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Overview of all agencies and platform metrics
          </p>
        </div>
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Overview of all agencies and platform metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading || !metrics}
            className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-xs font-medium text-[#e2e8f0] transition-colors hover:bg-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || !metrics}
            className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-xs font-medium text-[#e2e8f0] transition-colors hover:bg-[#334155] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : metrics ? (
          <>
            <MetricCard
              title="Total Agencies"
              value={formatNumber(metrics.totalAgencies)}
              icon={Building2}
              subtitle="Registered agencies"
            />
            <MetricCard
              title="Total Users"
              value={formatNumber(metrics.totalUsers)}
              icon={Users}
              subtitle="Platform users"
            />
            <MetricCard
              title="Total Policies"
              value={formatNumber(metrics.totalPolicies)}
              icon={FileText}
              subtitle="Across all agencies"
            />
            <MetricCard
              title="Total Clients"
              value={formatNumber(metrics.totalClients)}
              icon={UserCheck}
              subtitle="Across all agencies"
            />
            <MetricCard
              title="Premium Value"
              value={formatCurrency(metrics.totalPremiumValue)}
              icon={DollarSign}
              subtitle="Total premiums"
            />
          </>
        ) : null}
      </div>

      {/* Row 2: Health Alerts */}
      {loading ? (
        <HealthAlertsSkeleton />
      ) : healthAlerts ? (
        <HealthAlerts alerts={healthAlerts} />
      ) : null}

      {/* Row 3: Time Range Selector */}
      <TimeRangeSelector onChange={handleTimeRangeChange} />

      {/* Row 4: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading || growthLoading ? (
          <>
            <GrowthChartSkeleton />
            <EngagementChartSkeleton />
          </>
        ) : (
          <>
            <GrowthChart data={growth ?? []} />
            <EngagementChart
              activeAgencies={engagement?.activeAgencies ?? 0}
              inactiveAgencies={engagement?.inactiveAgencies ?? 0}
            />
          </>
        )}
      </div>
    </div>
  );
}
