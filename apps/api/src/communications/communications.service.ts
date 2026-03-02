import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { render } from '@react-email/render';
import { BulkAnnouncementEmail } from '../notifications/emails/bulk-announcement.js';
import type { SendBulkEmailDto } from './dto/send-bulk-email.dto.js';
import type { EmailHistoryQueryDto } from './dto/email-history-query.dto.js';
import type { UpdateEmailSettingsDto } from './dto/update-email-settings.dto.js';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Email Settings ──────────────────────────────────────

  /**
   * Get email settings for a tenant, returning defaults if none exist yet.
   */
  async getEmailSettings(tenantId: string) {
    const settings = await this.prisma.tenantEmailSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return {
        birthdayEmailsEnabled: true,
        renewalReminder60Days: true,
        renewalReminder30Days: true,
        renewalReminder7Days: true,
      };
    }

    return {
      birthdayEmailsEnabled: settings.birthdayEmailsEnabled,
      renewalReminder60Days: settings.renewalReminder60Days,
      renewalReminder30Days: settings.renewalReminder30Days,
      renewalReminder7Days: settings.renewalReminder7Days,
    };
  }

  /**
   * Update (or create) email settings for a tenant.
   */
  async updateEmailSettings(tenantId: string, dto: UpdateEmailSettingsDto) {
    const settings = await this.prisma.tenantEmailSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        birthdayEmailsEnabled: dto.birthdayEmailsEnabled ?? true,
        renewalReminder60Days: dto.renewalReminder60Days ?? true,
        renewalReminder30Days: dto.renewalReminder30Days ?? true,
        renewalReminder7Days: dto.renewalReminder7Days ?? true,
      },
      update: {
        ...(dto.birthdayEmailsEnabled !== undefined && {
          birthdayEmailsEnabled: dto.birthdayEmailsEnabled,
        }),
        ...(dto.renewalReminder60Days !== undefined && {
          renewalReminder60Days: dto.renewalReminder60Days,
        }),
        ...(dto.renewalReminder30Days !== undefined && {
          renewalReminder30Days: dto.renewalReminder30Days,
        }),
        ...(dto.renewalReminder7Days !== undefined && {
          renewalReminder7Days: dto.renewalReminder7Days,
        }),
      },
    });

    return {
      birthdayEmailsEnabled: settings.birthdayEmailsEnabled,
      renewalReminder60Days: settings.renewalReminder60Days,
      renewalReminder30Days: settings.renewalReminder30Days,
      renewalReminder7Days: settings.renewalReminder7Days,
    };
  }

  // ─── Email History ───────────────────────────────────────

  /**
   * Get email history with filtering and pagination.
   * CRITICAL: emailLog.count() is NOT overridden by tenant extension -- must include tenantId manually.
   */
  async getEmailHistory(tenantId: string, query: EmailHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }

    const [total, items] = await Promise.all([
      this.prisma.emailLog.count({ where } as any),
      this.prisma.emailLog.findMany({
        where: where as any,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
          sentBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Bulk Email ──────────────────────────────────────────

  /**
   * Send a bulk email to all clients (or a filtered subset) in a tenant.
   * Creates one EmailLog entry per recipient.
   */
  async sendBulkEmail(
    tenantId: string,
    userId: string,
    dto: SendBulkEmailDto,
  ) {
    // Fetch tenant name
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Build recipient filter
    const clientWhere: Record<string, unknown> = { tenantId };
    if (dto.recipientFilter === 'clients_only') {
      clientWhere.status = 'client';
    } else if (dto.recipientFilter === 'leads_only') {
      clientWhere.status = 'lead';
    }
    // 'all' = no status filter

    // Query recipients with email
    const recipients = await this.prisma.client.findMany({
      where: {
        ...clientWhere,
        email: { not: null },
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (recipients.length === 0) {
      return {
        success: true,
        sentCount: 0,
        message: 'No recipients found matching the filter criteria.',
      };
    }

    // Render the email template
    const html = await render(
      BulkAnnouncementEmail({
        agencyName: tenant.name,
        subject: dto.subject,
        bodyHtml: dto.body,
      }),
    );

    // Send via batch email
    const result = await this.notificationsService.sendBatchEmail({
      recipients: recipients.map((r) => ({
        email: r.email!,
        name: `${r.firstName} ${r.lastName}`,
      })),
      subject: dto.subject,
      html,
    });

    // Log each recipient to EmailLog
    // CRITICAL: emailLog.createMany() is NOT overridden by tenant extension -- must include tenantId manually.
    const now = new Date();
    try {
      await this.prisma.emailLog.createMany({
        data: recipients.map((r) => ({
          tenantId,
          clientId: r.id,
          recipientEmail: r.email!,
          type: 'bulk_announcement',
          subject: dto.subject,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error ?? null,
          sentAt: now,
          sentById: userId,
          metadata: {
            recipientFilter: dto.recipientFilter ?? 'all',
            totalRecipients: recipients.length,
          },
        })),
      });
    } catch (logError) {
      this.logger.error(`Failed to log bulk email sends: ${logError}`);
    }

    this.logger.log(
      `Bulk email sent to ${result.sentCount}/${recipients.length} recipients for tenant ${tenantId}`,
    );

    return {
      success: result.success,
      sentCount: result.sentCount,
      totalRecipients: recipients.length,
      error: result.error,
    };
  }
}
