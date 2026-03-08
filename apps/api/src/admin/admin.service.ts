import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
} from 'date-fns';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AuditService } from './audit/audit.service.js';

// Inlined from @anchor/shared (API doesn't have shared dep)
const ADMIN_ACTIONS = {
  SUPERADMIN_INVITE: 'superadmin.invite',
  SUPERADMIN_REMOVE: 'superadmin.remove',
} as const;

const ADMIN_TARGET_TYPES = {
  SUPER_ADMIN: 'super_admin',
} as const;

export interface PlatformMetrics {
  totalAgencies: number;
  totalUsers: number;
  totalPolicies: number;
  totalClients: number;
  totalPremiumValue: number;
}

export interface GrowthDataPoint {
  month: string;
  agencies: number;
  users: number;
  clients: number;
}

export interface EngagementMetrics {
  activeAgencies: number;
  inactiveAgencies: number;
}

export interface HealthAlert {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  value?: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    configService: ConfigService,
  ) {
    const supabaseUrl =
      configService.get<string>('SUPABASE_URL') ??
      configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
      );
    }

    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // ── Super-Admin Management ──────────────────────────────────────────

  /**
   * Return all super-admins ordered by createdAt DESC.
   */
  async getSuperAdmins() {
    return this.prisma.superAdmin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Invite a new super-admin by email.
   * Creates an auth user via Supabase invite and a SuperAdmin DB record.
   */
  async inviteSuperAdmin(
    email: string,
    firstName: string,
    lastName: string,
    invitedById: string,
  ) {
    // 1. Invite via Supabase Auth (service role)
    const { data, error } =
      await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { firstName, lastName, isSuperAdmin: true },
      });

    if (error) {
      this.logger.error(`Failed to invite super-admin ${email}: ${error.message}`);
      throw new Error(`Failed to invite: ${error.message}`);
    }

    // 2. Create SuperAdmin record with the auth user's ID
    const superAdmin = await this.prisma.superAdmin.create({
      data: {
        id: data.user.id,
        email,
        firstName,
        lastName,
      },
    });

    // 3. Log the action
    await this.auditService.log({
      superAdminId: invitedById,
      action: ADMIN_ACTIONS.SUPERADMIN_INVITE,
      targetType: ADMIN_TARGET_TYPES.SUPER_ADMIN,
      targetId: superAdmin.id,
      metadata: { email, firstName, lastName },
    });

    return superAdmin;
  }

  /**
   * Soft-delete a super-admin by setting isActive = false.
   * Does NOT remove from auth.users.
   */
  async removeSuperAdmin(superAdminId: string, removedById: string) {
    const superAdmin = await this.prisma.superAdmin.update({
      where: { id: superAdminId },
      data: { isActive: false },
    });

    await this.auditService.log({
      superAdminId: removedById,
      action: ADMIN_ACTIONS.SUPERADMIN_REMOVE,
      targetType: ADMIN_TARGET_TYPES.SUPER_ADMIN,
      targetId: superAdminId,
      metadata: { email: superAdmin.email },
    });

    return superAdmin;
  }

  /**
   * Cross-tenant aggregate counts for the platform.
   * Optionally filtered by date range (createdAt).
   */
  async getPlatformMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformMetrics> {
    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {};

    const [
      totalAgencies,
      totalUsers,
      totalPolicies,
      totalClients,
      premiumAgg,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: dateFilter }),
      this.prisma.user.count({ where: dateFilter }),
      this.prisma.policy.count({ where: dateFilter }),
      this.prisma.client.count({ where: dateFilter }),
      this.prisma.policy.aggregate({
        _sum: { premium: true },
        where: {
          ...dateFilter,
          status: { in: ['active', 'pending_renewal'] },
        },
      }),
    ]);

    return {
      totalAgencies,
      totalUsers,
      totalPolicies,
      totalClients,
      totalPremiumValue: premiumAgg._sum.premium
        ? parseFloat(premiumAgg._sum.premium.toString())
        : 0,
    };
  }

  /**
   * Generate monthly time series data for growth metrics.
   * Defaults to last 12 months if no dates provided.
   */
  async getGrowthTimeSeries(
    startDate?: Date,
    endDate?: Date,
  ): Promise<GrowthDataPoint[]> {
    const end = endDate ? endOfMonth(endDate) : endOfMonth(new Date());
    const start = startDate
      ? startOfMonth(startDate)
      : startOfMonth(subMonths(new Date(), 11));

    const months = eachMonthOfInterval({ start, end });

    const dataPoints: GrowthDataPoint[] = await Promise.all(
      months.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);

        const [agencies, users, clients] = await Promise.all([
          this.prisma.tenant.count({
            where: {
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          }),
          this.prisma.user.count({
            where: {
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          }),
          this.prisma.client.count({
            where: {
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          }),
        ]);

        return {
          month: format(monthStart, 'MMM yyyy'),
          agencies,
          users,
          clients,
        };
      }),
    );

    return dataPoints;
  }

  /**
   * Engagement metrics: active vs inactive agencies.
   * Active = at least one user with updatedAt in last 30 days.
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all tenants
    const totalTenants = await this.prisma.tenant.count();

    // Get tenants with at least one recently active user
    const activeTenantsResult = await this.prisma.user.groupBy({
      by: ['tenantId'],
      where: {
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const activeAgencies = activeTenantsResult.length;
    const inactiveAgencies = totalTenants - activeAgencies;

    return { activeAgencies, inactiveAgencies };
  }

  /**
   * Health alerts for the platform.
   * Checks email failure rates and inactive agencies.
   */
  async getHealthAlerts(): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [];

    // 1. Email failure rate in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [totalEmails, failedEmails] = await Promise.all([
      this.prisma.emailLog.count({
        where: { sentAt: { gte: twentyFourHoursAgo } },
      }),
      this.prisma.emailLog.count({
        where: {
          sentAt: { gte: twentyFourHoursAgo },
          status: { contains: 'fail' },
        },
      }),
    ]);

    if (totalEmails > 0) {
      const failureRate = (failedEmails / totalEmails) * 100;
      if (failureRate > 10) {
        alerts.push({
          type: 'error',
          category: 'email',
          message: `Email failure rate is ${failureRate.toFixed(1)}% (${failedEmails}/${totalEmails}) in the last 24 hours`,
          value: failureRate,
        });
      }
    }

    // 2. Inactive agencies (no user activity in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalTenants = await this.prisma.tenant.count();
    const activeTenantsResult = await this.prisma.user.groupBy({
      by: ['tenantId'],
      where: {
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    const inactiveCount = totalTenants - activeTenantsResult.length;
    if (inactiveCount > 0) {
      alerts.push({
        type: 'warning',
        category: 'engagement',
        message: `${inactiveCount} ${inactiveCount === 1 ? 'agency has' : 'agencies have'} had no user activity in the last 30 days`,
        value: inactiveCount,
      });
    }

    // 3. Storage warnings (placeholder — not implemented per-tenant yet)
    // Will be added when per-tenant storage tracking is implemented

    return alerts;
  }
}
