import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { CreateBudgetDto } from './dto/create-budget.dto.js';
import type { UpdateBudgetDto } from './dto/update-budget.dto.js';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Create a budget with optional BudgetCategory children in a $transaction.
   * Enforces @@unique([tenantId, month, year]) by catching Prisma unique constraint error.
   */
  async create(tenantId: string, userId: string, dto: CreateBudgetDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const budget = await tx.budget.create({
          data: {
            tenantId,
            month: dto.month,
            year: dto.year,
            totalLimit: dto.totalLimit,
            isActive: true,
            createdById: userId,
            categories: dto.categories?.length
              ? {
                  create: dto.categories.map((cat) => ({
                    category: cat.category,
                    limitAmount: cat.limitAmount,
                  })),
                }
              : undefined,
          } as any,
          include: { categories: true },
        });
        return budget;
      });
    } catch (error: any) {
      // P2002 = Unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException(
          `A budget already exists for ${dto.month}/${dto.year}`,
        );
      }
      throw error;
    }
  }

  /**
   * List all budgets for a tenant, ordered by year DESC, month DESC.
   * Includes categories.
   */
  async findAll(tenantId: string) {
    return this.prisma.budget.findMany({
      where: { tenantId },
      include: { categories: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get a single budget with categories. Validates tenantId ownership.
   */
  async findOne(tenantId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
      include: { categories: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  /**
   * Find the budget for the current month/year. Returns null if none exists.
   */
  async findCurrentMonth(tenantId: string) {
    const now = new Date();
    const month = now.getMonth() + 1; // JS months are 0-based
    const year = now.getFullYear();

    return this.prisma.budget.findFirst({
      where: { tenantId, month, year },
      include: { categories: true },
    });
  }

  /**
   * Update totalLimit and/or categories. For categories: delete existing and recreate.
   */
  async update(tenantId: string, budgetId: string, dto: UpdateBudgetDto) {
    // Verify budget exists and belongs to tenant
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update budget fields
      const updateData: any = {};
      if (dto.totalLimit !== undefined) {
        updateData.totalLimit = dto.totalLimit;
      }

      await tx.budget.update({
        where: { id: budgetId },
        data: updateData,
      });

      // If categories provided, delete existing and recreate
      if (dto.categories !== undefined) {
        await tx.budgetCategory.deleteMany({
          where: { budgetId },
        });

        if (dto.categories.length > 0) {
          await tx.budgetCategory.createMany({
            data: dto.categories.map((cat) => ({
              budgetId,
              category: cat.category,
              limitAmount: cat.limitAmount,
            })),
          });
        }
      }

      // Return updated budget with categories
      return tx.budget.findUnique({
        where: { id: budgetId },
        include: { categories: true },
      });
    });
  }

  /**
   * Delete a budget. onDelete: Cascade handles BudgetCategories.
   */
  async delete(tenantId: string, budgetId: string) {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budget.delete({
      where: { id: budgetId },
    });

    return { deleted: true };
  }

  /**
   * Calculate total approved spending for a given month.
   * CRITICAL: Only approved expenses count toward budgets.
   * Uses raw this.prisma for aggregate/groupBy (not tenant extension).
   */
  async getSpendingSummary(
    tenantId: string,
    month: number,
    year: number,
  ): Promise<{
    totalSpent: number;
    byCategory: { category: string; spent: number }[];
  }> {
    const dateStart = startOfMonth(new Date(year, month - 1));
    const dateEnd = endOfMonth(new Date(year, month - 1));

    // Total approved spending for the month
    const totalAgg = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        status: 'approved',
        date: { gte: dateStart, lte: dateEnd },
      },
      _sum: { amount: true },
    });

    // Group by category
    const categoryGroups = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        tenantId,
        status: 'approved',
        date: { gte: dateStart, lte: dateEnd },
      },
      _sum: { amount: true },
    });

    return {
      totalSpent: Number(totalAgg._sum.amount ?? 0),
      byCategory: categoryGroups.map((group) => ({
        category: group.category,
        spent: Number(group._sum.amount ?? 0),
      })),
    };
  }

  /**
   * Check budget threshold after an expense is approved.
   * Creates in-app notification for ALL admin users when spending >= 80% of limit.
   * Idempotent: checks hasExistingAlert before creating.
   */
  async checkBudgetThreshold(
    tenantId: string,
    category: string,
    month: number,
    year: number,
  ) {
    const budget = await this.prisma.budget.findFirst({
      where: { tenantId, month, year },
      include: { categories: true },
    });

    if (!budget) {
      return; // No budget for this month, nothing to check
    }

    const spending = await this.getSpendingSummary(tenantId, month, year);

    // Check per-category threshold
    const budgetCategory = budget.categories.find(
      (c) => c.category === category,
    );

    if (budgetCategory) {
      const categoryLimit = Number(budgetCategory.limitAmount);
      const categorySpent =
        spending.byCategory.find((c) => c.category === category)?.spent ?? 0;
      const categoryPercentage =
        categoryLimit > 0 ? (categorySpent / categoryLimit) * 100 : 0;

      if (categoryPercentage >= 80) {
        await this.createThresholdAlert(tenantId, {
          budgetId: budget.id,
          category,
          month,
          year,
          spent: categorySpent,
          limit: categoryLimit,
          percentage: Math.round(categoryPercentage),
          type: 'category',
        });
      }
    }

    // Check overall budget threshold
    const totalLimit = Number(budget.totalLimit);
    const overallPercentage =
      totalLimit > 0 ? (spending.totalSpent / totalLimit) * 100 : 0;

    if (overallPercentage >= 80) {
      await this.createThresholdAlert(tenantId, {
        budgetId: budget.id,
        category: '_overall',
        month,
        year,
        spent: spending.totalSpent,
        limit: totalLimit,
        percentage: Math.round(overallPercentage),
        type: 'overall',
      });
    }
  }

  /**
   * Create threshold alert for all admin users if not already existing.
   */
  private async createThresholdAlert(
    tenantId: string,
    metadata: {
      budgetId: string;
      category: string;
      month: number;
      year: number;
      spent: number;
      limit: number;
      percentage: number;
      type: string;
    },
  ) {
    // Idempotent check: match on budgetId + category + month + year
    const alertMeta = {
      budgetId: metadata.budgetId,
      category: metadata.category,
      month: metadata.month,
      year: metadata.year,
    };

    const exists = await this.alertsService.hasExistingAlert(
      tenantId,
      'budget_warning',
      alertMeta,
    );

    if (exists) {
      this.logger.debug(
        `Alert already exists for budget ${metadata.budgetId} category ${metadata.category}`,
      );
      return;
    }

    // Find all admin users in the tenant who have budget alerts enabled
    const adminUsers = await this.prisma.user.findMany({
      where: { tenantId, role: 'admin', notifyBudgetAlerts: true },
      select: { id: true },
    });

    const isOverall = metadata.type === 'overall';
    const title = isOverall
      ? `Overall budget at ${metadata.percentage}%`
      : `${metadata.category} budget at ${metadata.percentage}%`;
    const message = isOverall
      ? `Overall spending has reached ${metadata.percentage}% of the $${metadata.limit.toFixed(2)} monthly budget ($${metadata.spent.toFixed(2)} spent).`
      : `Spending in "${metadata.category}" has reached ${metadata.percentage}% of the $${metadata.limit.toFixed(2)} category limit ($${metadata.spent.toFixed(2)} spent).`;

    // Create alert for each admin user
    for (const admin of adminUsers) {
      await this.alertsService.create(tenantId, admin.id, {
        type: 'budget_warning',
        title,
        message,
        metadata: { ...metadata },
      });
    }

    this.logger.log(
      `Created budget warning alerts for ${adminUsers.length} admin(s): ${title}`,
    );
  }

  /**
   * Auto-renew budgets for all tenants. Called by cron on 1st of month.
   * Finds active budgets for previous month, creates new budgets for current month
   * with same limits, and deactivates the old ones.
   */
  async autoRenewBudgetsForAllTenants() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }

    this.logger.log(
      `Auto-renewing budgets from ${prevMonth}/${prevYear} to ${currentMonth}/${currentYear}`,
    );

    // Find all active budgets for previous month
    const previousBudgets = await this.prisma.budget.findMany({
      where: {
        month: prevMonth,
        year: prevYear,
        isActive: true,
      },
      include: { categories: true },
    });

    let renewed = 0;
    let skipped = 0;

    for (const budget of previousBudgets) {
      try {
        // Deactivate the old budget
        await this.prisma.budget.update({
          where: { id: budget.id },
          data: { isActive: false },
        });

        // Check if a budget for the current month already exists
        const existing = await this.prisma.budget.findFirst({
          where: {
            tenantId: budget.tenantId,
            month: currentMonth,
            year: currentYear,
          },
        });

        if (existing) {
          this.logger.debug(
            `Budget already exists for tenant ${budget.tenantId} ${currentMonth}/${currentYear}, skipping`,
          );
          skipped++;
          continue;
        }

        // Create new budget with same limits
        await this.prisma.budget.create({
          data: {
            tenantId: budget.tenantId,
            month: currentMonth,
            year: currentYear,
            totalLimit: budget.totalLimit,
            isActive: true,
            createdById: budget.createdById,
            categories: budget.categories.length > 0
              ? {
                  create: budget.categories.map((cat) => ({
                    category: cat.category,
                    limitAmount: cat.limitAmount,
                  })),
                }
              : undefined,
          } as any,
        });

        renewed++;
      } catch (error: any) {
        this.logger.error(
          `Failed to renew budget ${budget.id} for tenant ${budget.tenantId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Budget auto-renewal complete: ${renewed} renewed, ${skipped} skipped, ${previousBudgets.length} total processed`,
    );
  }
}
