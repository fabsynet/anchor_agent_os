'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  SummaryCards,
  type DashboardSummary,
} from '@/components/dashboard/summary-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import {
  RenewalsWidget,
  type UpcomingRenewal,
} from '@/components/dashboard/renewals-widget';
import {
  OverdueWidget,
  type OverdueTask,
} from '@/components/dashboard/overdue-widget';
import {
  ActivityFeed,
  type ActivityItem,
} from '@/components/dashboard/activity-feed';
import {
  PremiumIncomeCard,
  type PremiumIncome,
} from '@/components/dashboard/premium-income';
import { FinancialWidget } from '@/components/dashboard/financial-widget';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [renewals, setRenewals] = useState<UpcomingRenewal[] | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[] | null>(
    null
  );
  const [premiumIncome, setPremiumIncome] = useState<PremiumIncome | null>(
    null
  );

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          summaryData,
          renewalsData,
          overdueData,
          activityData,
          incomeData,
        ] = await Promise.all([
          api.get<DashboardSummary>('/api/dashboard/summary'),
          api.get<UpcomingRenewal[]>('/api/dashboard/renewals'),
          api.get<OverdueTask[]>('/api/dashboard/overdue-tasks'),
          api.get<ActivityItem[]>('/api/dashboard/recent-activity'),
          api.get<PremiumIncome>('/api/dashboard/premium-income'),
        ]);

        setSummary(summaryData);
        setRenewals(renewalsData);
        setOverdueTasks(overdueData);
        setRecentActivity(activityData);
        setPremiumIncome(incomeData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Today&apos;s Dashboard
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Detail Widgets -- 3 columns on lg, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RenewalsWidget renewals={renewals} loading={loading} />
        <OverdueWidget tasks={overdueTasks} loading={loading} />
        <ActivityFeed activities={recentActivity} loading={loading} />
      </div>

      {/* Premium Income */}
      <PremiumIncomeCard income={premiumIncome} loading={loading} />

      {/* Financial Overview (Phase 5) */}
      <FinancialWidget />
    </div>
  );
}
