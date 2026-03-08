import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { createSupabaseAdmin } from '../../common/config/supabase.config.js';

export interface UserListParams {
  search?: string;
  tenantId?: string;
  isActive?: string; // 'true' | 'false'
  page: number;
  limit: number;
}

@Injectable()
export class UsersService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(configService);
  }

  /**
   * Cross-tenant paginated user list with search and filters.
   */
  async getUserList(params: UserListParams) {
    const { search, tenantId, isActive, page, limit } = params;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get a single user with tenant info.
   */
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user;
  }

  /**
   * Disable a user (set isActive=false, ban in Supabase auth).
   */
  async disableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    });

    return { success: true, userId };
  }

  /**
   * Enable a user (set isActive=true, unban in Supabase auth).
   */
  async enableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true, deactivatedAt: null },
    });

    await this.supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });

    return { success: true, userId };
  }

  /**
   * Deactivate a user (soft delete: isActive=false, deactivatedAt=now, ban in Supabase).
   */
  async deactivateUser(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    await this.supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    });

    return { success: true, userId };
  }

  /**
   * Change a user's role (update DB and Supabase user_metadata).
   */
  async changeUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    await this.supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { user_role: role },
    });

    return { success: true, userId, role };
  }

  /**
   * Trigger a password reset for a user by generating a recovery link.
   */
  async triggerPasswordReset(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
    });

    if (error) {
      throw new Error(`Failed to generate recovery link: ${error.message}`);
    }

    return { success: true, userId, email: user.email };
  }
}
