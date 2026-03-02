import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto.js';
import { EmailHistoryQueryDto } from './dto/email-history-query.dto.js';
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto.js';

@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationsController {
  private readonly logger = new Logger(CommunicationsController.name);

  constructor(
    private readonly communicationsService: CommunicationsService,
  ) {}

  // ─── 1. GET /api/communications/settings ────────────────

  /**
   * Get email settings for the current tenant.
   */
  @Get('settings')
  async getSettings(@TenantId() tenantId: string) {
    return this.communicationsService.getEmailSettings(tenantId);
  }

  // ─── 2. PATCH /api/communications/settings ──────────────

  /**
   * Update email settings (admin only).
   */
  @Patch('settings')
  async updateSettings(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmailSettingsDto,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can update email settings');
    }
    return this.communicationsService.updateEmailSettings(tenantId, dto);
  }

  // ─── 3. GET /api/communications/history ─────────────────

  /**
   * Get email send history with filtering and pagination.
   */
  @Get('history')
  async getHistory(
    @TenantId() tenantId: string,
    @Query() query: EmailHistoryQueryDto,
  ) {
    return this.communicationsService.getEmailHistory(tenantId, query);
  }

  // ─── 4. POST /api/communications/send ───────────────────

  /**
   * Send a bulk email to clients (admin only).
   */
  @Post('send')
  async sendBulkEmail(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendBulkEmailDto,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can send bulk emails');
    }
    return this.communicationsService.sendBulkEmail(tenantId, user.id, dto);
  }
}
