import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { SearchComplianceDto } from './dto/search-compliance.dto.js';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query activity events with filters for compliance log.
   * Uses raw prisma (not tenantClient) because compliance queries are
   * cross-client within a tenant and need manual tenantId in where clause.
   */
  async findAll(tenantId: string, query: SearchComplianceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;

    const where: Record<string, unknown> = { tenantId };

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.policyId) {
      where.policyId = query.policyId;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate);
      }
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          policy: {
            select: { id: true, policyNumber: true, type: true },
          },
        },
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Return available activity event types for the filter dropdown.
   */
  async getActionTypes() {
    return [
      { value: 'policy_created', label: 'Policy Created' },
      { value: 'policy_updated', label: 'Policy Updated' },
      { value: 'policy_deleted', label: 'Policy Deleted' },
      { value: 'policy_status_changed', label: 'Policy Status Changed' },
      { value: 'task_completed', label: 'Task Completed' },
      { value: 'task_created', label: 'Task Created' },
      { value: 'task_status_changed', label: 'Task Status Changed' },
      { value: 'document_uploaded', label: 'Document Uploaded' },
      { value: 'document_deleted', label: 'Document Deleted' },
      { value: 'note_added', label: 'Note Added' },
      { value: 'client_created', label: 'Client Created' },
      { value: 'client_updated', label: 'Client Updated' },
      { value: 'client_status_changed', label: 'Client Status Changed' },
    ];
  }
}
