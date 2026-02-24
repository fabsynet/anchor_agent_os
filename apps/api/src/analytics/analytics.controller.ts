import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/overview
   * Overview stats: total clients, active policies, premium YTD, renewal rate.
   */
  @Get('overview')
  async getOverview(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getOverview(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /api/analytics/policy-breakdown
   * Policy type breakdown with counts and premium sums.
   */
  @Get('policy-breakdown')
  async getPolicyBreakdown(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getPolicyBreakdown(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /api/analytics/client-stats
   * Client statistics: total, active, leads, new this period.
   */
  @Get('client-stats')
  async getClientStats(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getClientStats(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /api/analytics/renewal-pipeline
   * Renewal pipeline: monthly active/expiring/expired counts.
   */
  @Get('renewal-pipeline')
  async getRenewalPipeline(@TenantId() tenantId: string) {
    return this.analyticsService.getRenewalPipeline(tenantId);
  }

  /**
   * GET /api/analytics/expense-summary
   * Expense summary: approved, pending, by category, budget usage.
   */
  @Get('expense-summary')
  async getExpenseSummary(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getExpenseSummary(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /api/analytics/compliance-summary
   * Compliance summary: total events, by type, by user.
   */
  @Get('compliance-summary')
  async getComplianceSummary(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getComplianceSummary(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /api/analytics/cross-sell
   * Cross-sell opportunities: clients with coverage gaps.
   */
  @Get('cross-sell')
  async getCrossSellOpportunities(@TenantId() tenantId: string) {
    return this.analyticsService.getCrossSellOpportunities(tenantId);
  }

  /**
   * GET /api/analytics/premium-by-product
   * Premium by product line with customType breakdown for 'other'.
   */
  @Get('premium-by-product')
  async getPremiumByProductLine(
    @TenantId() tenantId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getPremiumByProductLine(
      tenantId,
      query.startDate,
      query.endDate,
    );
  }
}
