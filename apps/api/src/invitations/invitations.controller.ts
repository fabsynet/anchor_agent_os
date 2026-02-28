import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';

@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * POST /api/invitations
   * Send an invitation to a new user. Admin only.
   */
  @Post()
  @Roles('admin')
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.inviteUser(
      tenantId,
      user.id,
      dto.email,
      dto.role,
    );
  }

  /**
   * GET /api/invitations
   * List all invitations for the current tenant. Admin only.
   */
  @Get()
  @Roles('admin')
  async findAll(@TenantId() tenantId: string) {
    return this.invitationsService.listByTenant(tenantId);
  }

  /**
   * POST /api/invitations/accept-mine
   * Mark the current user's pending invitation as accepted.
   * Any authenticated user (no admin role required).
   */
  @Post('accept-mine')
  async acceptMine(@CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.acceptInvitation(user.email);
  }

  /**
   * PATCH /api/invitations/:id/revoke
   * Revoke a pending invitation. Admin only.
   */
  @Patch(':id/revoke')
  @Roles('admin')
  async revoke(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invitationsService.revokeInvitation(tenantId, id);
  }

  /**
   * POST /api/invitations/:id/resend
   * Resend an invitation email. Admin only.
   */
  @Post(':id/resend')
  @Roles('admin')
  async resend(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invitationsService.resendInvitation(tenantId, id);
  }
}
