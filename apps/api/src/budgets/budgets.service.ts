import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
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
   * Create a budget with name, totalLimit, and optional date range.
   */
  async create(tenantId: string, userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        tenantId,
        name: dto.name,
        totalLimit: dto.totalLimit,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
        createdById: userId,
      },
    });
  }

  /**
   * List all budgets for a tenant, ordered by createdAt DESC.
   */
  async findAll(tenantId: string) {
    return this.prisma.budget.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single budget. Validates tenantId ownership.
   */
  async findOne(tenantId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  /**
   * Find all active budgets for a tenant.
   */
  async findActiveBudgets(tenantId: string) {
    return this.prisma.budget.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a budget's fields.
   */
  async update(tenantId: string, budgetId: string, dto: UpdateBudgetDto) {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.totalLimit !== undefined) updateData.totalLimit = dto.totalLimit;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    // Handle nullable date fields
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    });
  }

  /**
   * Delete a budget. SetNull on expenses handles FK cleanup.
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
   * Calculate total approved spending for a given budget.
   * Aggregates by budgetId on approved expenses.
   */
  async getSpendingSummary(
    tenantId: string,
    budgetId: string,
  ): Promise<{ totalSpent: number }> {
    const totalAgg = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        budgetId,
        status: 'approved',
      },
      _sum: { amount: true },
    });

    return {
      totalSpent: Number(totalAgg._sum.amount ?? 0),
    };
  }

  /**
   * Check budget threshold after an expense is approved.
   * Creates in-app notification for ALL admin users when spending >= 80% of limit.
   * Only fires if the expense has a budgetId.
   */
  async checkBudgetThreshold(tenantId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!budget) {
      return;
    }

    const spending = await this.getSpendingSummary(tenantId, budgetId);
    const totalLimit = Number(budget.totalLimit);
    const percentage =
      totalLimit > 0 ? (spending.totalSpent / totalLimit) * 100 : 0;

    if (percentage >= 80) {
      await this.createThresholdAlert(tenantId, {
        budgetId: budget.id,
        budgetName: budget.name,
        spent: spending.totalSpent,
        limit: totalLimit,
        percentage: Math.round(percentage),
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
      budgetName: string;
      spent: number;
      limit: number;
      percentage: number;
    },
  ) {
    const alertMeta = {
      budgetId: metadata.budgetId,
    };

    const exists = await this.alertsService.hasExistingAlert(
      tenantId,
      'budget_warning',
      alertMeta,
    );

    if (exists) {
      this.logger.debug(
        `Alert already exists for budget ${metadata.budgetId}`,
      );
      return;
    }

    const adminUsers = await this.prisma.user.findMany({
      where: { tenantId, role: 'admin', notifyBudgetAlerts: true },
      select: { id: true },
    });

    const title = `"${metadata.budgetName}" budget at ${metadata.percentage}%`;
    const message = `Spending on "${metadata.budgetName}" has reached ${metadata.percentage}% of the $${metadata.limit.toFixed(2)} limit ($${metadata.spent.toFixed(2)} spent).`;

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
   * Manually renew a budget: deactivate old, create copy with "(Renewed)" suffix.
   */
  async renew(tenantId: string, userId: string, budgetId: string) {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    // Deactivate old budget
    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { isActive: false },
    });

    // Create renewed copy
    const newBudget = await this.prisma.budget.create({
      data: {
        tenantId,
        name: `${existing.name} (Renewed)`,
        totalLimit: existing.totalLimit,
        startDate: existing.startDate,
        endDate: existing.endDate,
        isActive: true,
        createdById: userId,
      },
    });

    return newBudget;
  }
}
