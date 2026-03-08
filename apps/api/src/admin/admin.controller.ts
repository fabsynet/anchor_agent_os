import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getPlatformMetrics(start, end);
  }

  @Get('metrics/growth')
  async getGrowthTimeSeries(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getGrowthTimeSeries(start, end);
  }

  @Get('metrics/engagement')
  async getEngagementMetrics() {
    return this.adminService.getEngagementMetrics();
  }

  @Get('health')
  async getHealthAlerts() {
    return this.adminService.getHealthAlerts();
  }
}
