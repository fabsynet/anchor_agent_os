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
import { UsersService } from './users.service.js';

@Controller('admin/users')
@UseGuards(SuperAdminGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async listUsers(
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserList({
      search,
      tenantId,
      isActive,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    return this.usersService.getUserDetail(id);
  }

  @Post(':id/disable')
  async disableUser(
    @Param('id') id: string,
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.usersService.disableUser(id);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'user.disable',
      targetType: 'user',
      targetId: id,
    });

    return result;
  }

  @Post(':id/enable')
  async enableUser(
    @Param('id') id: string,
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.usersService.enableUser(id);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'user.enable',
      targetType: 'user',
      targetId: id,
    });

    return result;
  }

  @Post(':id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.usersService.deactivateUser(id, body.reason);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'user.deactivate',
      targetType: 'user',
      targetId: id,
      metadata: body.reason ? { reason: body.reason } : undefined,
    });

    return result;
  }

  @Patch(':id/role')
  async changeUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.usersService.changeUserRole(id, body.role);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'user.change_role',
      targetType: 'user',
      targetId: id,
      metadata: { role: body.role },
    });

    return result;
  }

  @Post(':id/password-reset')
  async triggerPasswordReset(
    @Param('id') id: string,
    @Req() req: { user: SuperAdminUser },
  ) {
    const result = await this.usersService.triggerPasswordReset(id);

    await this.auditService.log({
      superAdminId: req.user.id,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: id,
    });

    return result;
  }
}
