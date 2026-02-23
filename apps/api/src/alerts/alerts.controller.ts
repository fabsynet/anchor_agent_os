import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * GET /api/alerts
   * List notifications for the current user.
   * Query: unreadOnly (boolean string), limit (number string).
   */
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alertsService.findAll(tenantId, user.id, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /api/alerts/unread-count
   * Get unread notification count for the current user.
   */
  @Get('unread-count')
  async getUnreadCount(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const count = await this.alertsService.getUnreadCount(tenantId, user.id);
    return { count };
  }

  /**
   * PATCH /api/alerts/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  async markAsRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alertsService.markAsRead(tenantId, user.id, id);
  }

  /**
   * POST /api/alerts/mark-all-read
   * Mark all notifications as read for the current user.
   */
  @Post('mark-all-read')
  async markAllAsRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.alertsService.markAllAsRead(tenantId, user.id);
  }
}
