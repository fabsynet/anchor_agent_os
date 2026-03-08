import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard.js';
import { AuditService } from './audit.service.js';

@Controller('admin/audit-logs')
@UseGuards(SuperAdminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('superAdminId') superAdminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLogs({
      action,
      targetType,
      superAdminId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  async getAuditLogStats() {
    return this.auditService.getAuditLogStats();
  }
}
