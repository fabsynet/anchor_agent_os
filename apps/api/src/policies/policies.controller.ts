import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PoliciesService } from './policies.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { CreatePolicyDto } from './dto/create-policy.dto.js';
import { UpdatePolicyDto } from './dto/update-policy.dto.js';

@Controller('clients/:clientId/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  /**
   * GET /api/clients/:clientId/policies
   * List policies for a client with optional pagination.
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.policiesService.findAll(tenantId, clientId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * POST /api/clients/:clientId/policies
   * Create a policy for a client.
   */
  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policiesService.create(tenantId, clientId, user.id, dto);
  }

  /**
   * GET /api/clients/:clientId/policies/:id
   * Get a single policy.
   */
  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.policiesService.findOne(tenantId, clientId, id);
  }

  /**
   * PATCH /api/clients/:clientId/policies/:id
   * Update a policy (validates status transitions).
   */
  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.update(tenantId, clientId, id, user.id, dto);
  }

  /**
   * DELETE /api/clients/:clientId/policies/:id
   * Delete a policy.
   */
  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.policiesService.remove(tenantId, clientId, id, user.id);
  }
}
