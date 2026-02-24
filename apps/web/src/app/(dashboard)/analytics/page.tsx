'use client';

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  TimeRangeSelector,
  getDateRange,
} from '@/components/analytics/time-range-selector';
import { AnalyticsOverviewTab } from '@/components/analytics/analytics-overview-tab';
import { AnalyticsClientsTab } from '@/components/analytics/analytics-clients-tab';
import { AnalyticsPoliciesTab } from '@/components/analytics/analytics-policies-tab';
import { AnalyticsRenewalsTab } from '@/components/analytics/analytics-renewals-tab';
import { AnalyticsExpensesTab } from '@/components/analytics/analytics-expenses-tab';
import { AnalyticsComplianceTab } from '@/components/analytics/analytics-compliance-tab';
import { AnalyticsCrossSellTab } from '@/components/analytics/analytics-crosssell-tab';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('12mo');

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="size-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track agency performance, clients, and policies
        </p>
      </div>

      {/* Time Range Selector */}
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="flex-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="cross-sell">Cross-Sell</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <AnalyticsOverviewTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="clients">
          <AnalyticsClientsTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="policies">
          <AnalyticsPoliciesTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="renewals">
          <AnalyticsRenewalsTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="expenses">
          <AnalyticsExpensesTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="compliance">
          <AnalyticsComplianceTab startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="cross-sell">
          <AnalyticsCrossSellTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
