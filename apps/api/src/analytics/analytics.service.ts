import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  startOfDay,
  format,
} from 'date-fns';

/**
 * Cross-sell bundle definitions (inlined -- API doesn't have @anchor/shared dep).
 * Based on Canadian insurance industry standard product pairings.
 */
const CROSS_SELL_BUNDLES = [
  { name: 'Auto + Home', types: ['auto', 'home'] },
  { name: 'Life + Health', types: ['life', 'health'] },
  { name: 'Home + Umbrella', types: ['home', 'umbrella'] },
];

const MIN_POLICY_TYPES_FOR_CROSSSELL = 2;

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a Prisma where clause fragment for date range filtering.
   */
  private buildDateFilter(
    startDate?: string,
    endDate?: string,
    field: string = 'createdAt',
  ): Record<string, any> {
    const filter: Record<string, any> = {};
    if (startDate || endDate) {
      filter[field] = {};
      if (startDate) filter[field].gte = new Date(startDate);
      if (endDate) filter[field].lte = new Date(endDate);
    }
    return filter;
  }

  /**
   * Overview stats: total clients, active policies, total premium YTD, renewal rate.
   * CRITICAL: Uses raw this.prisma with manual tenantId (not tenantClient).
   */
  async getOverview(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    const yearStart = startOfYear(now);

    const [totalClients, activePolicies, premiumAgg, expiringCount, renewedCount] =
      await Promise.all([
        this.prisma.client.count({
          where: { tenantId },
        }),
        this.prisma.policy.count({
          where: {
            tenantId,
            status: { in: ['active', 'pending_renewal'] },
          },
        }),
        this.prisma.policy.aggregate({
          where: {
            tenantId,
            status: { in: ['active', 'pending_renewal', 'renewed'] as any },
            premium: { not: null },
            OR: [
              { startDate: { gte: yearStart } },
              { startDate: null, createdAt: { gte: yearStart } },
            ],
          },
          _sum: { premium: true },
        }),
        // Count policies that expired or were pending renewal in period
        this.prisma.policy.count({
          where: {
            tenantId,
            status: { in: ['expired', 'pending_renewal', 'renewed'] as any },
            endDate: { gte: yearStart, lte: now },
          },
        }),
        // Count policies that were renewed in period
        this.prisma.policy.count({
          where: {
            tenantId,
            status: 'renewed' as any,
            updatedAt: { gte: yearStart, lte: now },
          },
        }),
      ]);

    const totalPremiumYtd = Number(premiumAgg._sum.premium ?? 0);
    const renewalRate =
      expiringCount > 0
        ? Math.round((renewedCount / expiringCount) * 100)
        : 0;

    return {
      totalClients,
      activePolicies,
      totalPremiumYtd,
      renewalRate,
    };
  }

  /**
   * Policy type breakdown: groupBy type with count and total premium.
   * CRITICAL: Uses raw this.prisma for groupBy (not tenantClient).
   */
  async getPolicyBreakdown(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    const dateFilter = this.buildDateFilter(startDate, endDate);
    Object.assign(where, dateFilter);

    const breakdown = await this.prisma.policy.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
      _sum: { premium: true },
    });

    return breakdown.map((item) => ({
      type: item.type,
      count: item._count.id,
      totalPremium: Number(item._sum.premium ?? 0),
    }));
  }

  /**
   * Client stats: total, active, leads, and new this period.
   * CRITICAL: Uses raw this.prisma for count (not tenantClient).
   */
  async getClientStats(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [totalClients, activeClients, leads, newThisPeriod] =
      await Promise.all([
        this.prisma.client.count({
          where: { tenantId },
        }),
        this.prisma.client.count({
          where: { tenantId, status: 'client' },
        }),
        this.prisma.client.count({
          where: { tenantId, status: 'lead' },
        }),
        this.prisma.client.count({
          where: {
            tenantId,
            ...dateFilter,
          },
        }),
      ]);

    return {
      totalClients,
      activeClients,
      leads,
      newThisPeriod,
    };
  }

  /**
   * Renewal pipeline: for each of the last N months, count active/expiring/expired policies.
   * CRITICAL: Uses raw this.prisma for count (not tenantClient).
   */
  async getRenewalPipeline(tenantId: string, months: number = 12) {
    const now = new Date();
    const monthPromises = [];

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(now, months - 1 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      monthPromises.push(
        Promise.all([
          // Active: policies with status active that overlap this month
          this.prisma.policy.count({
            where: {
              tenantId,
              status: 'active' as any,
              startDate: { lte: monthEnd },
              OR: [
                { endDate: null },
                { endDate: { gte: monthStart } },
              ],
            },
          }),
          // Expiring: pending_renewal with endDate in this month
          this.prisma.policy.count({
            where: {
              tenantId,
              status: { in: ['pending_renewal'] as any },
              endDate: { gte: monthStart, lte: monthEnd },
            },
          }),
          // Expired: expired with endDate in this month
          this.prisma.policy.count({
            where: {
              tenantId,
              status: 'expired' as any,
              endDate: { gte: monthStart, lte: monthEnd },
            },
          }),
        ]).then(([active, expiring, expired]) => ({
          month: format(monthStart, 'MMM yyyy'),
          active,
          expiring,
          expired,
        })),
      );
    }

    return Promise.all(monthPromises);
  }

  /**
   * Expense summary: total approved, total pending, by category, budget usage.
   * CRITICAL: Uses raw this.prisma for aggregate/groupBy (not tenantClient).
   */
  async getExpenseSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate, 'date');

    const [approvedAgg, pendingAgg, byCategory, currentBudget] =
      await Promise.all([
        this.prisma.expense.aggregate({
          where: {
            tenantId,
            status: 'approved' as any,
            ...dateFilter,
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            tenantId,
            status: 'pending_approval' as any,
            ...dateFilter,
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.groupBy({
          by: ['category'],
          where: {
            tenantId,
            status: 'approved' as any,
            ...dateFilter,
          },
          _sum: { amount: true },
        }),
        // Get current month budget for usage calculation
        this.prisma.budget.findFirst({
          where: {
            tenantId,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            isActive: true,
          },
        }),
      ]);

    const totalApproved = Number(approvedAgg._sum.amount ?? 0);
    const totalPending = Number(pendingAgg._sum.amount ?? 0);
    const budgetUsage =
      currentBudget && Number(currentBudget.totalLimit) > 0
        ? Math.round(
            (totalApproved / Number(currentBudget.totalLimit)) * 100,
          )
        : null;

    return {
      totalApproved,
      totalPending,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        amount: Number(item._sum.amount ?? 0),
      })),
      budgetUsage,
    };
  }

  /**
   * Compliance summary: total events, by type, by user.
   * CRITICAL: Uses raw this.prisma for count/groupBy (not tenantClient).
   */
  async getComplianceSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [totalEvents, byType, byUserId] = await Promise.all([
      this.prisma.activityEvent.count({
        where: { tenantId, ...dateFilter },
      }),
      this.prisma.activityEvent.groupBy({
        by: ['type'],
        where: { tenantId, ...dateFilter },
        _count: { id: true },
      }),
      this.prisma.activityEvent.groupBy({
        by: ['userId'],
        where: { tenantId, ...dateFilter },
        _count: { id: true },
      }),
    ]);

    // Resolve user names for byUser
    const userIds = byUserId.map((item) => item.userId);
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];

    const userMap = new Map(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]),
    );

    return {
      totalEvents,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      byUser: byUserId.map((item) => ({
        userId: item.userId,
        userName: userMap.get(item.userId) ?? 'Unknown',
        count: item._count.id,
      })),
    };
  }

  /**
   * Cross-sell opportunities: identify clients with coverage gaps.
   * Uses predefined bundles to detect missing policy types.
   */
  async getCrossSellOpportunities(tenantId: string) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, status: 'client' },
      include: {
        policies: {
          where: { status: { in: ['active', 'pending_renewal'] as any } },
          select: { type: true },
        },
      },
    });

    return clients
      .map((client) => {
        const activeTypes = [
          ...new Set(client.policies.map((p) => p.type)),
        ];
        const gaps: string[] = [];

        // Check each bundle for partial coverage
        for (const bundle of CROSS_SELL_BUNDLES) {
          const hasAll = bundle.types.every((t) =>
            activeTypes.includes(t as any),
          );
          const hasSome = bundle.types.some((t) =>
            activeTypes.includes(t as any),
          );
          if (hasSome && !hasAll) {
            const missing = bundle.types.filter(
              (t) => !activeTypes.includes(t as any),
            );
            gaps.push(...missing);
          }
        }

        // Flag clients with fewer than minimum policy types
        const fewPolicies =
          activeTypes.length < MIN_POLICY_TYPES_FOR_CROSSSELL;

        return {
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          activeTypes: activeTypes as string[],
          gaps: [...new Set(gaps)],
          fewPolicies,
          hasGaps: gaps.length > 0 || fewPolicies,
        };
      })
      .filter((c) => c.hasGaps)
      .map(({ hasGaps, ...rest }) => rest);
  }

  /**
   * Premium by product line: groupBy type with optional customType breakdown for 'other'.
   * CRITICAL: Uses raw this.prisma for groupBy (not tenantClient).
   */
  async getPremiumByProductLine(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Standard types breakdown
    const standardBreakdown = await this.prisma.policy.groupBy({
      by: ['type'],
      where: {
        tenantId,
        type: { not: 'other' as any },
        ...dateFilter,
      },
      _count: { id: true },
      _sum: { premium: true },
    });

    // For 'other' type, break down by customType
    const otherBreakdown = await this.prisma.policy.groupBy({
      by: ['type', 'customType'],
      where: {
        tenantId,
        type: 'other' as any,
        ...dateFilter,
      },
      _count: { id: true },
      _sum: { premium: true },
    });

    return [
      ...standardBreakdown.map((item) => ({
        type: item.type,
        customType: null as string | null,
        count: item._count.id,
        totalPremium: Number(item._sum.premium ?? 0),
      })),
      ...otherBreakdown.map((item) => ({
        type: item.type,
        customType: item.customType,
        count: item._count.id,
        totalPremium: Number(item._sum.premium ?? 0),
      })),
    ];
  }
}
