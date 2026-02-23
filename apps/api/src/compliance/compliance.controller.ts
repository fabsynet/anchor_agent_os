import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import { SearchComplianceDto } from './dto/search-compliance.dto.js';

/**
 * Compliance log controller -- READ-ONLY.
 * The compliance log is immutable; no POST, PUT, PATCH, or DELETE endpoints.
 */
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * GET /api/compliance
   * List compliance events with filters and pagination.
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: SearchComplianceDto,
  ) {
    return this.complianceService.findAll(tenantId, query);
  }

  /**
   * GET /api/compliance/action-types
   * Return available activity event types for the filter dropdown.
   */
  @Get('action-types')
  async getActionTypes() {
    return this.complianceService.getActionTypes();
  }
}
