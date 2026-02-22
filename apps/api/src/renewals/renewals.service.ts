import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { subDays, startOfDay, isAfter, isEqual } from 'date-fns';

/**
 * Renewal milestones: 60/30/7 days before policy expiration.
 * Matches RENEWAL_MILESTONES from @anchor/shared.
 */
const RENEWAL_MILESTONES = [
  { daysBefore: 60, priority: 'medium' as const, label: '60-day reminder' },
  { daysBefore: 30, priority: 'high' as const, label: '30-day reminder' },
  { daysBefore: 7, priority: 'urgent' as const, label: '7-day reminder' },
] as const;

/**
 * Policy with client relation data, as expected by generateTasksForPolicy.
 */
interface PolicyWithClient {
  id: string;
  tenantId: string;
  clientId: string;
  type: string;
  endDate: Date | null;
  createdById: string;
  client: {
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class RenewalsService {
  private readonly logger = new Logger(RenewalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate renewal tasks for ALL policies across ALL tenants.
   * Called by the daily cron job. Uses raw this.prisma (no CLS context).
   */
  async generateRenewalTasksForAllTenants(): Promise<void> {
    const policies = await this.prisma.policy.findMany({
      where: {
        endDate: { not: null },
        status: { in: ['active', 'pending_renewal'] },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(
      `Found ${policies.length} policies with expiration dates for renewal task generation`,
    );

    let tasksCreated = 0;
    for (const policy of policies) {
      const created = await this.generateTasksForPolicy(
        policy as unknown as PolicyWithClient,
      );
      tasksCreated += created;
    }

    this.logger.log(
      `Renewal task generation complete. Created ${tasksCreated} new tasks.`,
    );
  }

  /**
   * Generate renewal tasks for a single policy at 60/30/7 day milestones.
   * Idempotent: skips if a non-done renewal task already exists for the milestone.
   *
   * CRITICAL: The policy parameter MUST include client relation data (firstName, lastName)
   * for generating the task description.
   *
   * Returns the number of tasks created.
   */
  async generateTasksForPolicy(policy: PolicyWithClient): Promise<number> {
    if (!policy.endDate) return 0;

    const today = startOfDay(new Date());
    let tasksCreated = 0;

    for (const milestone of RENEWAL_MILESTONES) {
      const targetDate = startOfDay(
        subDays(new Date(policy.endDate), milestone.daysBefore),
      );

      // Skip if target date is in the past
      if (!isAfter(targetDate, today) && !isEqual(targetDate, today)) {
        continue;
      }

      // Idempotency check: skip if a non-done renewal task already exists for this milestone
      const existing = await this.prisma.task.findFirst({
        where: {
          policyId: policy.id,
          type: 'renewal',
          renewalDaysBefore: milestone.daysBefore,
          status: { not: 'done' },
        },
      });

      if (existing) {
        continue;
      }

      const clientName = `${policy.client.firstName} ${policy.client.lastName}`;
      const endDateStr = new Date(policy.endDate).toLocaleDateString('en-CA');

      await this.prisma.task.create({
        data: {
          tenantId: policy.tenantId,
          title: `Renewal: ${milestone.daysBefore}-day reminder for ${policy.type} policy`,
          description: `Policy for ${clientName} expires on ${endDateStr}. Review and process renewal.`,
          type: 'renewal',
          status: 'todo',
          priority: milestone.priority,
          dueDate: targetDate,
          policyId: policy.id,
          clientId: policy.clientId,
          createdById: policy.createdById,
          renewalDaysBefore: milestone.daysBefore,
        },
      });

      tasksCreated++;
      this.logger.debug(
        `Created ${milestone.daysBefore}-day renewal task for policy ${policy.id}`,
      );
    }

    return tasksCreated;
  }

  /**
   * Delete all pending (non-done) renewal tasks for a policy.
   * Called when policy is cancelled/expired or endDate changes.
   */
  async deleteRenewalTasksForPolicy(policyId: string): Promise<number> {
    const result = await this.prisma.task.deleteMany({
      where: {
        policyId,
        type: 'renewal',
        status: { not: 'done' },
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Deleted ${result.count} pending renewal tasks for policy ${policyId}`,
      );
    }

    return result.count;
  }

  /**
   * Regenerate renewal tasks for a policy: delete pending + create new.
   * Called when policy endDate changes.
   */
  async regenerateRenewalTasks(policy: PolicyWithClient): Promise<void> {
    await this.deleteRenewalTasksForPolicy(policy.id);
    await this.generateTasksForPolicy(policy);
    this.logger.log(
      `Regenerated renewal tasks for policy ${policy.id}`,
    );
  }
}
