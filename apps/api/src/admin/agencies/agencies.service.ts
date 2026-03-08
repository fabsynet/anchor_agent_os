import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface AgencyListParams {
  search?: string;
  isSuspended?: string; // 'true' | 'false'
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: string;
}

@Injectable()
export class AgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated list of agencies with optional search and suspension filter.
   * Uses raw prisma (cross-tenant).
   */
  async getAgencyList(params: AgencyListParams) {
    const { search, isSuspended, page, limit, sortBy, sortDir } = params;

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isSuspended === 'true') {
      where.isSuspended = true;
    } else if (isSuspended === 'false') {
      where.isSuspended = false;
    }

    const orderBy: Prisma.TenantOrderByWithRelationInput = {};
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const field = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortDir === 'asc' ? 'asc' : 'desc';
    (orderBy as Record<string, string>)[field] = direction;

    const [agencies, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              policies: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { agencies, total, page, limit };
  }

  /**
   * Detailed agency view with users and entity counts.
   */
  async getAgencyDetail(tenantId: string) {
    const agency = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            deactivatedAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            clients: true,
            policies: true,
            tasks: true,
            documents: true,
            expenses: true,
          },
        },
      },
    });

    if (!agency) {
      throw new NotFoundException(`Agency ${tenantId} not found`);
    }

    return agency;
  }

  /**
   * Paginated activity events for an agency.
   */
  async getAgencyActivity(tenantId: string, page: number, limit: number) {
    const where: Prisma.ActivityEventWhereInput = { tenantId };

    const [events, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  /**
   * Policy counts grouped by status and type for an agency.
   */
  async getAgencyPoliciesSummary(tenantId: string) {
    const [byStatus, byType] = await Promise.all([
      this.prisma.policy.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      this.prisma.policy.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: { type: true },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
    };
  }

  /**
   * Suspend an agency.
   */
  async suspendAgency(tenantId: string, reason: string) {
    const agency = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!agency) {
      throw new NotFoundException(`Agency ${tenantId} not found`);
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
      },
    });
  }

  /**
   * Unsuspend an agency.
   */
  async unsuspendAgency(tenantId: string) {
    const agency = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!agency) {
      throw new NotFoundException(`Agency ${tenantId} not found`);
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isSuspended: false,
        suspendedAt: null,
      },
    });
  }

  /**
   * Update agency limits (userCap, storageCap).
   */
  async updateAgencyLimits(
    tenantId: string,
    data: { userCap?: number; storageCap?: number },
  ) {
    const agency = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!agency) {
      throw new NotFoundException(`Agency ${tenantId} not found`);
    }

    const updateData: Prisma.TenantUpdateInput = {};
    if (data.userCap !== undefined) updateData.userCap = data.userCap;
    if (data.storageCap !== undefined) updateData.storageCap = data.storageCap;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });
  }

  /**
   * Export all agency data as structured JSON.
   */
  async exportAgencyData(tenantId: string) {
    const agency = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!agency) {
      throw new NotFoundException(`Agency ${tenantId} not found`);
    }

    const [users, clients, tasks, expenses] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.client.findMany({
        where: { tenantId },
        include: {
          policies: {
            select: {
              id: true,
              policyNumber: true,
              type: true,
              carrier: true,
              status: true,
              premium: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: { tenantId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
        },
      }),
      this.prisma.expense.findMany({
        where: { tenantId },
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          status: true,
          date: true,
        },
      }),
    ]);

    // Get document metadata (not file content)
    const documents = await this.prisma.document.findMany({
      where: { tenantId },
      select: {
        id: true,
        fileName: true,
        category: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return {
      agency,
      users,
      clients,
      tasks,
      documents,
      expenses,
      exportedAt: new Date().toISOString(),
    };
  }
}
