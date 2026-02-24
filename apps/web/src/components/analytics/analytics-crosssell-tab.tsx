'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { CrossSellOpportunity } from '@anchor/shared';

import { api } from '@/lib/api';
import { exportToCsv, exportToPdf } from '@/lib/export-utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from './chart-card';
import { ExportButtons } from './export-buttons';

/** All known policy types for gap tracking */
const ALL_POLICY_TYPES = [
  'auto',
  'home',
  'life',
  'health',
  'commercial',
  'travel',
  'umbrella',
];

/** Icon color map for gap type summary cards */
const GAP_ICON_COLORS: Record<string, string> = {
  auto: 'text-blue-600',
  home: 'text-green-600',
  life: 'text-purple-600',
  health: 'text-red-600',
  commercial: 'text-orange-600',
  travel: 'text-cyan-600',
  umbrella: 'text-yellow-600',
};

export function AnalyticsCrossSellTab() {
  const [opportunities, setOpportunities] = useState<CrossSellOpportunity[]>(
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
        const data = await api.get<CrossSellOpportunity[]>(
          '/api/analytics/cross-sell',
        );
        if (!cancelled) setOpportunities(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load cross-sell data',
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
  }, []);

  // Aggregate: count clients missing each policy type
  const gapCounts: Record<string, number> = {};
  for (const type of ALL_POLICY_TYPES) {
    gapCounts[type] = opportunities.filter((o) =>
      o.gaps.includes(type),
    ).length;
  }

  // Clients with < 2 policy types
  const fewPoliciesCount = opportunities.filter((o) => o.fewPolicies).length;

  const handleExportCsv = async () => {
    const rows = opportunities.map((o) => ({
      Client: o.clientName,
      'Active Types': o.activeTypes.join(', '),
      'Missing Types': o.gaps.join(', '),
      'Policy Count': o.activeTypes.length,
    }));
    await exportToCsv(rows, 'analytics-cross-sell');
  };

  const handleExportPdf = async () => {
    await exportToPdf(
      'Cross-Sell Opportunities',
      ['Client', 'Active Types', 'Missing Types', 'Policies'],
      opportunities.map((o) => [
        o.clientName,
        o.activeTypes.join(', '),
        o.gaps.join(', '),
        o.activeTypes.length,
      ]),
      'analytics-cross-sell',
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <ShieldAlert className="mx-auto mb-3 size-10 opacity-40" />
        No cross-sell opportunities found. All clients have full coverage.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_POLICY_TYPES.filter((type) => gapCounts[type] > 0).map((type) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missing {type.charAt(0).toUpperCase() + type.slice(1)}
              </CardTitle>
              <ShieldAlert
                className={`size-5 ${GAP_ICON_COLORS[type] ?? 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{gapCounts[type]}</div>
              <p className="text-xs text-muted-foreground">
                {gapCounts[type] === 1 ? 'client' : 'clients'}
              </p>
            </CardContent>
          </Card>
        ))}
        {fewPoliciesCount > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Under-Insured
              </CardTitle>
              <AlertTriangle className="size-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{fewPoliciesCount}</div>
              <p className="text-xs text-muted-foreground">
                {'< 2 policy types'}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Opportunities
            </CardTitle>
            <Users className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              clients with gaps
            </p>
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

      {/* Detail Table */}
      <ChartCard
        title="Coverage Gap Details"
        description="All clients with coverage gaps and cross-sell opportunities"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium text-muted-foreground">
                  Client Name
                </th>
                <th className="pb-2 text-left font-medium text-muted-foreground">
                  Active Types
                </th>
                <th className="pb-2 text-left font-medium text-muted-foreground">
                  Missing Types
                </th>
                <th className="pb-2 text-right font-medium text-muted-foreground">
                  # Policies
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.clientId} className="border-b last:border-0">
                  <td className="py-2">
                    <Link
                      href={`/clients/${o.clientId}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {o.clientName}
                    </Link>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {o.activeTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {o.gaps.map((g) => (
                        <Badge
                          key={g}
                          variant="destructive"
                          className="text-xs"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-right">{o.activeTypes.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
