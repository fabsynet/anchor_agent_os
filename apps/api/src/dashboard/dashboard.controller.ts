import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/dashboard/summary
   * Returns summary counts: overdueCount, dueTodayCount, renewalsIn30Days, activeClients
   */
  @Get('summary')
  async getSummary(@TenantId() tenantId: string) {
    return this.dashboardService.getSummary(tenantId);
  }

  /**
   * GET /api/dashboard/renewals
   * Returns upcoming renewals (policies expiring within 60 days) with client info and daysRemaining.
   */
  @Get('renewals')
  async getUpcomingRenewals(@TenantId() tenantId: string) {
    return this.dashboardService.getUpcomingRenewals(tenantId);
  }

  /**
   * GET /api/dashboard/overdue-tasks
   * Returns overdue tasks (dueDate < today, status != done) with client info.
   */
  @Get('overdue-tasks')
  async getOverdueTasks(@TenantId() tenantId: string) {
    return this.dashboardService.getOverdueTasks(tenantId);
  }

  /**
   * GET /api/dashboard/recent-activity
   * Returns the 10 most recent activity events with client and user info.
   */
  @Get('recent-activity')
  async getRecentActivity(@TenantId() tenantId: string) {
    return this.dashboardService.getRecentActivity(tenantId);
  }

  /**
   * GET /api/dashboard/premium-income
   * Returns premium income metrics: currentMonth, ytd, previousMonth, trendPercentage.
   * Uses policy startDate (effective date) with createdAt fallback.
   */
  @Get('premium-income')
  async getPremiumIncome(@TenantId() tenantId: string) {
    return this.dashboardService.getPremiumIncome(tenantId);
  }

  /**
   * GET /api/dashboard/financial
   * Returns financial summary for the dashboard widget.
   * Access: admin users OR users with canViewFinancials=true.
   * NOTE: canViewFinancials is not on AuthenticatedUser interface, so we query the DB.
   */
  @Get('financial')
  async getFinancialSummary(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Admin always has access
    if (user.role !== 'admin') {
      // Check canViewFinancials from DB
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { canViewFinancials: true },
      });

      if (!dbUser?.canViewFinancials) {
        throw new ForbiddenException(
          'You do not have permission to view financial data',
        );
      }
    }

    return this.dashboardService.getFinancialSummary(tenantId);
  }
}
