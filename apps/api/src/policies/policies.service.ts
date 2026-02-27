import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { startOfDay, addDays } from 'date-fns';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { RenewalsService } from '../renewals/renewals.service.js';
import { CreatePolicyDto } from './dto/create-policy.dto.js';
import { UpdatePolicyDto } from './dto/update-policy.dto.js';

/**
 * Valid policy status transitions.
 * Terminal states (expired, cancelled) have no valid transitions.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['pending_renewal', 'cancelled', 'expired'],
  pending_renewal: ['renewed', 'expired', 'cancelled'],
  renewed: ['active'],
  expired: [],
  cancelled: [],
};

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
    private readonly renewalsService: RenewalsService,
  ) {}

  /**
   * Create a policy for a client.
   * Uses $transaction to atomically create the policy, auto-convert lead, and log events.
   */
  async create(
    tenantId: string,
    clientId: string,
    userId: string,
    dto: CreatePolicyDto,
  ) {
    // Verify client exists in this tenant
    const client = await this.prisma.tenantClient.client.findFirst({
      where: { id: clientId },
      include: { _count: { select: { policies: true } } },
    });

    if (!client) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    const policyData = {
      tenantId,
      clientId,
      createdById: userId,
      type: dto.type,
      customType: dto.customType ?? null,
      carrier: dto.carrier ?? null,
      policyNumber: dto.policyNumber ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      premium: dto.premium ?? null,
      coverageAmount: dto.coverageAmount ?? null,
      deductible: dto.deductible ?? null,
      paymentFrequency: dto.paymentFrequency ?? null,
      brokerCommission: dto.brokerCommission ?? null,
      status: dto.status ?? 'draft',
      notes: dto.notes ?? null,
    };

    // Use $transaction for atomicity: create policy + auto-convert lead + log events
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create the policy (tx is raw, must include tenantId manually)
      const policy = await tx.policy.create({
        data: policyData,
      });

      // 2. Auto-convert lead to client on first policy
      const isLead = client.status === 'lead';
      const isFirstPolicy = (client as any)._count?.policies === 0;

      if (isLead && isFirstPolicy) {
        await tx.client.update({
          where: { id: clientId },
          data: { status: 'client' },
        });

        // Log status change event
        await tx.activityEvent.create({
          data: {
            tenantId,
            clientId,
            userId,
            type: 'client_status_changed',
            description: 'Automatically converted from lead to client on first policy',
            metadata: { from: 'lead', to: 'client', trigger: 'first_policy' },
          },
        });
      }

      // 3. Log policy created event
      await tx.activityEvent.create({
        data: {
          tenantId,
          clientId,
          userId,
          type: 'policy_created',
          description: `Created ${dto.type} policy${dto.carrier ? ` with ${dto.carrier}` : ''}`,
          metadata: {
            policyId: policy.id,
            type: dto.type,
            carrier: dto.carrier ?? null,
            status: policyData.status,
          },
        },
      });

      return policy;
    });

    this.logger.log(
      `Policy created: ${result.id} (${dto.type}) for client ${clientId} by user ${userId}`,
    );

    // Generate renewal tasks if policy has an endDate
    if (result.endDate) {
      try {
        const policyWithClient = await this.prisma.policy.findUnique({
          where: { id: result.id },
          include: {
            client: { select: { firstName: true, lastName: true } },
          },
        });
        if (policyWithClient) {
          await this.renewalsService.generateTasksForPolicy(
            policyWithClient as any,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to generate renewal tasks for policy ${result.id}`,
          error,
        );
      }
    }

    return result;
  }

  /**
   * List all policies across all clients for a tenant, with search/filter/pagination.
   */
  async findAllForTenant(
    tenantId: string,
    query: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (query.status === 'pending_renewal') {
      // "Pending Renewal" includes both formally-marked pending_renewal policies
      // AND active policies expiring within 60 days (matching the dashboard widget)
      const today = startOfDay(new Date());
      const in60Days = addDays(today, 60);
      andConditions.push({
        OR: [
          { status: 'pending_renewal' },
          { status: 'active', endDate: { gte: today, lte: in60Days } },
        ],
      });
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      andConditions.push({
        OR: [
          {
            client: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            client: {
              lastName: { contains: query.search, mode: 'insensitive' },
            },
          },
          { carrier: { contains: query.search, mode: 'insensitive' } },
          { policyNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [policies, total] = await Promise.all([
      this.prisma.tenantClient.policy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.policy.count({ where: { ...where, tenantId } }),
    ]);

    return {
      data: policies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List policies for a client with optional pagination, ordered by createdAt descending.
   */
  async findAll(
    tenantId: string,
    clientId: string,
    query?: { page?: number; limit?: number },
  ) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const [policies, total] = await Promise.all([
      this.prisma.tenantClient.policy.findMany({
        where: { clientId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { documents: true } },
        },
      }),
      this.prisma.policy.count({ where: { tenantId, clientId } }),
    ]);

    return {
      data: policies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single policy by ID.
   */
  async findOne(tenantId: string, clientId: string, id: string) {
    const policy = await this.prisma.tenantClient.policy.findFirst({
      where: { id, clientId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    return policy;
  }

  /**
   * Update a policy. Validates status transitions if status is being changed.
   */
  async update(
    tenantId: string,
    clientId: string,
    id: string,
    userId: string,
    dto: UpdatePolicyDto,
  ) {
    const existing = await this.prisma.tenantClient.policy.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    // Validate status transition if status is changing
    if (dto.status && dto.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from '${existing.status}' to '${dto.status}'. Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.customType !== undefined) updateData.customType = dto.customType;
    if (dto.carrier !== undefined) updateData.carrier = dto.carrier;
    if (dto.policyNumber !== undefined)
      updateData.policyNumber = dto.policyNumber;
    if (dto.startDate !== undefined)
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.premium !== undefined) updateData.premium = dto.premium;
    if (dto.coverageAmount !== undefined)
      updateData.coverageAmount = dto.coverageAmount;
    if (dto.deductible !== undefined) updateData.deductible = dto.deductible;
    if (dto.paymentFrequency !== undefined)
      updateData.paymentFrequency = dto.paymentFrequency;
    if (dto.brokerCommission !== undefined)
      updateData.brokerCommission = dto.brokerCommission;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.tenantClient.policy.update({
      where: { id },
      data: updateData as any,
    });

    // Log activity events
    if (dto.status && dto.status !== existing.status) {
      await this.timelineService.createActivityEvent(
        tenantId,
        clientId,
        userId,
        'policy_status_changed',
        `Policy status changed from ${existing.status} to ${dto.status}`,
        {
          policyId: id,
          from: existing.status,
          to: dto.status,
        },
      );
    } else {
      await this.timelineService.createActivityEvent(
        tenantId,
        clientId,
        userId,
        'policy_updated',
        `Updated ${existing.type} policy`,
        {
          policyId: id,
          changedFields: Object.keys(updateData),
        },
      );
    }

    // Renewal lifecycle hooks
    try {
      // If status changed to cancelled or expired, delete pending renewal tasks
      if (
        dto.status &&
        dto.status !== existing.status &&
        (dto.status === 'cancelled' || dto.status === 'expired')
      ) {
        await this.renewalsService.deleteRenewalTasksForPolicy(id);
      }

      // If endDate changed, regenerate renewal tasks
      if (dto.endDate !== undefined) {
        const existingEndDate = existing.endDate
          ? new Date(existing.endDate).toISOString()
          : null;
        const newEndDate = dto.endDate
          ? new Date(dto.endDate).toISOString()
          : null;

        if (existingEndDate !== newEndDate) {
          if (newEndDate) {
            // Query fresh policy with client includes for task description
            const policyWithClient = await this.prisma.policy.findUnique({
              where: { id },
              include: {
                client: { select: { firstName: true, lastName: true } },
              },
            });
            if (policyWithClient) {
              await this.renewalsService.regenerateRenewalTasks(
                policyWithClient as any,
              );
            }
          } else {
            // endDate was removed, just delete pending renewal tasks
            await this.renewalsService.deleteRenewalTasksForPolicy(id);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to update renewal tasks for policy ${id}`,
        error,
      );
    }

    return updated;
  }

  /**
   * Delete a policy and log an activity event.
   */
  async remove(
    tenantId: string,
    clientId: string,
    id: string,
    userId: string,
  ) {
    const existing = await this.prisma.tenantClient.policy.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    await this.prisma.tenantClient.policy.delete({
      where: { id },
    });

    // Log deletion event
    await this.timelineService.createActivityEvent(
      tenantId,
      clientId,
      userId,
      'policy_deleted',
      `Deleted ${existing.type} policy${existing.carrier ? ` with ${existing.carrier}` : ''}`,
      {
        policyId: id,
        type: existing.type,
        carrier: existing.carrier,
        status: existing.status,
      },
    );

    return { deleted: true, id };
  }
}
