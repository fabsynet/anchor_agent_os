import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { createSupabaseAdmin } from '../../common/config/supabase.config.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ImpersonationService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(configService);
  }

  /**
   * Start impersonation of a target user.
   * Generates a magic link token for the super-admin to assume the target user's session.
   */
  async startImpersonation(superAdminId: string, targetUserId: string) {
    // Look up target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        tenant: { select: { id: true, name: true, isSuspended: true } },
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    if (!targetUser.isActive) {
      throw new BadRequestException('Cannot impersonate an inactive user');
    }

    if (targetUser.tenant.isSuspended) {
      throw new ForbiddenException(
        'Cannot impersonate a user in a suspended agency',
      );
    }

    // Generate magic link for the target user
    const { data, error } =
      await this.supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetUser.email,
      });

    if (error) {
      throw new Error(`Failed to generate impersonation link: ${error.message}`);
    }

    // Log impersonation start
    await this.auditService.log({
      superAdminId,
      action: 'impersonation.start',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        targetEmail: targetUser.email,
        tenantId: targetUser.tenant.id,
        tenantName: targetUser.tenant.name,
      },
    });

    // Calculate expiry (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      tokenHash: data.properties?.hashed_token,
      email: targetUser.email,
      expiresAt,
      tenantId: targetUser.tenant.id,
      tenantName: targetUser.tenant.name,
    };
  }

  /**
   * End impersonation session (audit log only).
   */
  async endImpersonation(superAdminId: string, targetUserId: string) {
    await this.auditService.log({
      superAdminId,
      action: 'impersonation.end',
      targetType: 'user',
      targetId: targetUserId,
    });

    return { success: true };
  }
}
