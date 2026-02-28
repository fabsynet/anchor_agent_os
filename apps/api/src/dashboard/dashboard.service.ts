import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import {
  startOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  differenceInDays,
} from 'date-fns';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetsService: BudgetsService,
  ) {}

  /**
   * Get summary counts for the dashboard.
   * Uses raw prisma (not tenantClient) because count() is not overridden by tenant extension.
   */
  async getSummary(tenantId: string) {
    const today = startOfDay(new Date());
    const in30Days = addDays(today, 30);

    const [overdueCount, dueTodayCount, renewalsIn30Days, activeClients] =
      await Promise.all([
        // Overdue tasks: dueDate < today AND status != done
        this.prisma.task.count({
          where: {
            tenantId,
            dueDate: { lt: today },
            status: { not: 'done' },
          },
        }),

        // Due today: dueDate is today AND status != done
        this.prisma.task.count({
          where: {
            tenantId,
            dueDate: {
              gte: today,
              lt: addDays(today, 1),
            },
            status: { not: 'done' },
          },
        }),

        // Renewals in next 30 days: policies with endDate between today and 30 days from now
        this.prisma.policy.count({
          where: {
            tenantId,
            endDate: {
              gte: today,
              lte: in30Days,
            },
            status: { in: ['active', 'pending_renewal'] },
          },
        }),

        // Active clients: clients with status = 'client'
        this.prisma.client.count({
          where: {
            tenantId,
            status: 'client',
          },
        }),
      ]);

    return { overdueCount, dueTodayCount, renewalsIn30Days, activeClients };
  }

  /**
   * Get upcoming renewals -- policies expiring within the next 60 days.
   */
  async getUpcomingRenewals(tenantId: string) {
    const today = startOfDay(new Date());
    const in60Days = addDays(today, 60);

    const policies = await this.prisma.tenantClient.policy.findMany({
      where: {
        endDate: {
          gte: today,
          lte: in60Days,
        },
        status: { in: ['active', 'pending_renewal'] },
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 20,
    });

    return policies.map((policy) => ({
      ...policy,
      daysRemaining: policy.endDate
        ? differenceInDays(policy.endDate, today)
        : null,
    }));
  }

  /**
   * Get overdue tasks -- tasks where dueDate < today and status != done.
   */
  async getOverdueTasks(tenantId: string) {
    const today = startOfDay(new Date());

    return this.prisma.tenantClient.task.findMany({
      where: {
        dueDate: { lt: today },
        status: { not: 'done' },
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
  }

  /**
   * Get recent activity -- latest 10 activity events.
   */
  async getRecentActivity(tenantId: string) {
    return this.prisma.tenantClient.activityEvent.findMany({
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Get premium income metrics: current month, YTD, previous month, and trend percentage.
   * CRITICAL: Uses startDate (policy effective date), NOT createdAt (data entry date).
   * Falls back to createdAt if startDate is null.
   */
  async getPremiumIncome(tenantId: string) {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const validStatuses = ['active', 'pending_renewal', 'renewed'];

    // We need to use raw queries or multiple queries since aggregate doesn't support
    // COALESCE(startDate, createdAt) natively. We'll use $queryRawUnsafe for accuracy.
    // But to keep it simple and Prisma-idiomatic, we'll do two queries per period:
    // 1. Policies WITH startDate in range
    // 2. Policies WITHOUT startDate but createdAt in range
    // Then sum them.

    const [currentMonth, ytd, previousMonth] = await Promise.all([
      this.aggregatePremium(
        tenantId,
        validStatuses,
        currentMonthStart,
        currentMonthEnd,
      ),
      this.aggregatePremium(tenantId, validStatuses, yearStart, currentMonthEnd),
      this.aggregatePremium(
        tenantId,
        validStatuses,
        previousMonthStart,
        previousMonthEnd,
      ),
    ]);

    // Calculate trend percentage with zero-division protection
    const trendPercentage =
      previousMonth === 0
        ? currentMonth > 0
          ? 100
          : 0
        : Number(
            (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1),
          );

    return {
      currentMonth,
      ytd,
      previousMonth,
      trendPercentage,
    };
  }

  /**
   * Aggregate premium for a date range using startDate with createdAt fallback.
   * Uses manual tenantId because aggregate() is not overridden by tenant extension.
   */
  private async aggregatePremium(
    tenantId: string,
    validStatuses: string[],
    dateStart: Date,
    dateEnd: Date,
  ): Promise<number> {
    // Policies with startDate in range
    const withStartDate = await this.prisma.policy.aggregate({
      where: {
        tenantId,
        status: { in: validStatuses as any },
        premium: { not: null },
        startDate: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      _sum: { premium: true },
    });

    // Policies without startDate but createdAt in range (fallback)
    const withoutStartDate = await this.prisma.policy.aggregate({
      where: {
        tenantId,
        status: { in: validStatuses as any },
        premium: { not: null },
        startDate: null,
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      _sum: { premium: true },
    });

    return (
      Number(withStartDate._sum.premium ?? 0) +
      Number(withoutStartDate._sum.premium ?? 0)
    );
  }

  /**
   * Get financial summary for the dashboard widget.
   * Includes: total spent, expense count, top category, budget usage, per-category breakdown (donut).
   * Uses raw this.prisma for count/aggregate (not tenant extension).
   */
  async getFinancialSummary(tenantId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get active budgets
    const activeBudgets = await this.budgetsService.findActiveBudgets(tenantId);

    // Use first active budget for overall usage display (if any)
    const primaryBudget = activeBudgets.length > 0 ? activeBudgets[0] : null;

    let budgetTotal: number | null = null;
    let budgetUsedPercentage: number | null = null;

    if (primaryBudget) {
      const spending = await this.budgetsService.getSpendingSummary(
        tenantId,
        primaryBudget.id,
      );
      budgetTotal = Number(primaryBudget.totalLimit);
      budgetUsedPercentage =
        budgetTotal > 0
          ? Math.round((spending.totalSpent / budgetTotal) * 100)
          : null;
    }

    // Total approved spending this month (for donut chart, regardless of budget)
    const totalAgg = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        status: 'approved',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });
    const totalSpent = Number(totalAgg._sum.amount ?? 0);

    // Count of approved expenses this month
    const expenseCount = await this.prisma.expense.count({
      where: {
        tenantId,
        status: 'approved',
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    // Group by category for donut chart
    const categoryGroups = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        tenantId,
        status: 'approved',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    const categories = categoryGroups
      .map((group) => ({
        name: group.category,
        spent: Number(group._sum.amount ?? 0),
      }))
      .sort((a, b) => b.spent - a.spent);

    // Top category (highest spend)
    const topCategory = categories.length > 0 ? categories[0].name : null;

    return {
      totalSpent,
      expenseCount,
      topCategory,
      budgetTotal,
      budgetUsedPercentage,
      categories,
      month,
      year,
    };
  }
}
