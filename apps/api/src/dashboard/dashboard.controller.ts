import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
}
