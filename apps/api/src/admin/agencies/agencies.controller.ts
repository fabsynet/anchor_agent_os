import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard.js';
import type { SuperAdminUser } from '../../auth/guards/super-admin.guard.js';
import { AuditService } from '../audit/audit.service.js';
import { AgenciesService } from './agencies.service.js';

@Controller('admin/agencies')
@UseGuards(SuperAdminGuard)
export class AgenciesController {
  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async listAgencies(
    @Query('search') search?: string,
    @Query('isSuspended') isSuspended?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.agenciesService.getAgencyList({
      search,
      isSuspended,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sortBy,
      sortDir,
    });
  }

  @Get(':id')
  async getAgencyDetail(@Param('id') id: string) {
    return this.agenciesService.getAgencyDetail(id);
  }

  @Get(':id/activity')
  async getAgencyActivity(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agenciesService.getAgencyActivity(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id/policies-summary')
  async getAgencyPoliciesSummary(@Param('id') id: string) {
    return this.agenciesService.getAgencyPoliciesSummary(id);
  }

  @Post(':id/suspend')
  async suspendAgency(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.agenciesService.suspendAgency(id, body.reason);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'agency.suspend',
      targetType: 'tenant',
      targetId: id,
      metadata: { reason: body.reason },
    });

    return result;
  }

  @Post(':id/unsuspend')
  async unsuspendAgency(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.agenciesService.unsuspendAgency(id);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'agency.unsuspend',
      targetType: 'tenant',
      targetId: id,
      metadata: body.reason ? { reason: body.reason } : undefined,
    });

    return result;
  }

  @Patch(':id/limits')
  async updateAgencyLimits(
    @Param('id') id: string,
    @Body() body: { userCap?: number; storageCap?: number },
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.agenciesService.updateAgencyLimits(id, body);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'agency.update_limits',
      targetType: 'tenant',
      targetId: id,
      metadata: { userCap: body.userCap, storageCap: body.storageCap },
    });

    return result;
  }

  @Get(':id/export')
  async exportAgencyData(@Param('id') id: string) {
    return this.agenciesService.exportAgencyData(id);
  }
}
