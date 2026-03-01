import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { render } from '@react-email/render';
import { startOfDay, addDays, differenceInDays, format } from 'date-fns';
import {
  DailyDigestEmail,
  type DigestData,
  type DigestTask,
  type DigestRenewal,
} from './emails/daily-digest.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly zeptoApiKey: string | null = null;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ZEPTOMAIL_API_KEY');
    if (apiKey) {
      this.zeptoApiKey = apiKey;
      this.logger.log('ZeptoMail configured');
    } else {
      this.logger.warn(
        'ZEPTOMAIL_API_KEY not configured. Email sending disabled.',
      );
    }

    this.fromAddress =
      this.configService.get<string>('ZEPTOMAIL_FROM_ADDRESS') ??
      'noreply@anchor.com';
    this.fromName =
      this.configService.get<string>('ZEPTOMAIL_FROM_NAME') ?? 'Anchor';
  }

  /**
   * Send daily digest emails for all tenants.
   * Called by the scheduler at 8 AM.
   * CRITICAL: Uses raw this.prisma -- cron job has no HTTP context, no CLS tenant.
   */
  async sendDailyDigestForAllTenants(): Promise<void> {
    this.logger.log('Starting daily digest for all tenants...');

    if (!this.zeptoApiKey) {
      this.logger.warn('ZeptoMail not configured. Skipping daily digest.');
      return;
    }

    try {
      // Get all tenants
      const tenants = await this.prisma.tenant.findMany({
        select: { id: true, name: true },
      });

      this.logger.log(`Found ${tenants.length} tenant(s) for daily digest`);

      for (const tenant of tenants) {
        try {
          await this.sendDigestForTenant(tenant.id);
        } catch (error) {
          this.logger.error(
            `Failed to send digest for tenant ${tenant.id}: ${error}`,
          );
        }
      }

      this.logger.log('Daily digest completed for all tenants');
    } catch (error) {
      this.logger.error(`Daily digest failed: ${error}`);
    }
  }

  /**
   * Send digest emails to all users in a tenant who haven't opted out.
   */
  private async sendDigestForTenant(tenantId: string): Promise<void> {
    // Get users who haven't opted out
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        digestOptOut: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailRenewalReminders: true,
      },
    });

    if (users.length === 0) {
      this.logger.debug(`No users to send digest for tenant ${tenantId}`);
      return;
    }

    for (const user of users) {
      try {
        const digestData = await this.getDigestDataForUser(
          tenantId,
          user.id,
        );

        // Strip renewal milestones if user opted out of email renewal reminders
        if (!user.emailRenewalReminders) {
          digestData.renewalMilestones = [];
        }

        // Skip empty digests
        if (
          digestData.overdueTasks.length === 0 &&
          digestData.renewalMilestones.length === 0
        ) {
          this.logger.debug(
            `Skipping empty digest for user ${user.email}`,
          );
          continue;
        }

        await this.sendDigestToUser(user.email, {
          ...digestData,
          userName: user.firstName,
          date: format(new Date(), 'MMMM d, yyyy'),
        });

        this.logger.log(`Digest sent to ${user.email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send digest to ${user.email}: ${error}`,
        );
      }
    }
  }

  /**
   * Get digest data for a specific user within a tenant.
   * CRITICAL: Uses raw this.prisma with manual tenantId (no CLS context in cron).
   */
  async getDigestDataForUser(
    tenantId: string,
    userId: string,
  ): Promise<Omit<DigestData, 'userName' | 'date'>> {
    const today = startOfDay(new Date());
    const in61Days = addDays(today, 61);

    const [overdueTasks, renewalMilestones] = await Promise.all([
      // Overdue tasks: dueDate < today, status != done
      this.prisma.task.findMany({
        where: {
          tenantId,
          dueDate: { lt: today },
          status: { not: 'done' },
        },
        include: {
          client: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),

      // Renewal milestones: type = renewal, status = todo, dueDate within 61 days
      // CRITICAL: 61-day window covers ALL milestone intervals (60/30/7 days)
      this.prisma.task.findMany({
        where: {
          tenantId,
          type: 'renewal',
          status: 'todo',
          dueDate: {
            gte: today,
            lte: in61Days,
          },
        },
        include: {
          client: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 30,
      }),
    ]);

    return {
      overdueTasks: overdueTasks.map(
        (task): DigestTask => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          clientName: task.client
            ? `${task.client.firstName} ${task.client.lastName}`
            : null,
          priority: task.priority,
        }),
      ),
      renewalMilestones: renewalMilestones.map(
        (task): DigestRenewal => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          clientName: task.client
            ? `${task.client.firstName} ${task.client.lastName}`
            : null,
          daysRemaining: task.dueDate
            ? differenceInDays(task.dueDate, today)
            : null,
        }),
      ),
    };
  }

  /**
   * Render and send the digest email to a user via ZeptoMail.
   */
  private async sendDigestToUser(
    email: string,
    data: DigestData,
  ): Promise<void> {
    if (!this.zeptoApiKey) {
      this.logger.warn('ZeptoMail not configured. Cannot send email.');
      return;
    }

    try {
      const html = await render(DailyDigestEmail(data));

      const response = await fetch('https://api.zeptomail.com/v1.1/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Zoho-enczapikey ${this.zeptoApiKey}`,
        },
        body: JSON.stringify({
          from: { address: this.fromAddress, name: this.fromName },
          to: [{ email_address: { address: email } }],
          subject: `Anchor Daily Digest - ${data.date}`,
          htmlbody: html,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `ZeptoMail error for ${email} (${response.status}): ${body}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send digest email to ${email}: ${error}`);
      throw error;
    }
  }
}
