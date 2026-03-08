import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface LogAuditParams {
  superAdminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface AuditLogFilters {
  action?: string;
  targetType?: string;
  superAdminId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry for a super-admin action.
   * Uses raw prisma (not tenantClient) since audit logs are cross-tenant.
   */
  async log(params: LogAuditParams) {
    return this.prisma.adminAuditLog.create({
      data: {
        superAdminId: params.superAdminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  }

  /**
   * Query audit logs with optional filters, pagination, and date range.
   * Returns paginated results ordered by createdAt DESC.
   */
  async getAuditLogs(filters: AuditLogFilters) {
    const where: Record<string, unknown> = {};

    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }
    if (filters.superAdminId) {
      where.superAdminId = filters.superAdminId;
    }
    if (filters.startDate || filters.endDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.startDate) {
        createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        createdAt.lte = new Date(filters.endDate);
      }
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          superAdmin: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  /**
   * Returns count of audit log entries grouped by action type
   * for the last 30 days.
   */
  async getAuditLogStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await this.prisma.adminAuditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });

    return stats.map((s) => ({
      action: s.action,
      count: s._count.action,
    }));
  }
}
