import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';

@Controller('policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AllPoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * GET /api/policies
   * List all policies across all clients for the current tenant.
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.policiesService.findAllForTenant(tenantId, {
      search: search || undefined,
      status: status || undefined,
      type: type || undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
