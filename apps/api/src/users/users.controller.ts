import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users
   * List all users in the current tenant. Admin only.
   */
  @Get()
  @Roles('admin')
  async findAll() {
    return this.usersService.findByTenant();
  }

  /**
   * PATCH /api/users/:id/setup-complete
   * Mark a user's setup wizard as completed.
   */
  @Patch(':id/setup-complete')
  async markSetupComplete(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.updateSetupCompleted(id);
  }

  /**
   * PATCH /api/users/:id/financial-access
   * Admin-only: Toggle canViewFinancials for a team member.
   */
  @Patch(':id/financial-access')
  @Roles('admin')
  async updateFinancialAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { canViewFinancials: boolean },
  ) {
    return this.usersService.updateFinancialAccess(id, body.canViewFinancials);
  }

  /**
   * PATCH /api/users/:id/reactivate
   * Admin-only: Reactivate a deactivated team member.
   */
  @Patch(':id/reactivate')
  @Roles('admin')
  async reactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ) {
    return this.usersService.reactivateUser(id, tenantId);
  }
}
