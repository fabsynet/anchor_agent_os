import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an in-app notification for a specific user.
   */
  async create(
    tenantId: string,
    userId: string,
    data: { type: string; title: string; message: string; metadata?: any },
  ) {
    return this.prisma.inAppNotification.create({
      data: {
        tenantId,
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? undefined,
      },
    });
  }

  /**
   * List notifications for a user. Default limit 20, ordered by createdAt DESC.
   */
  async findAll(
    tenantId: string,
    userId: string,
    query: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const { unreadOnly = false, limit = 20 } = query;

    const where: any = { tenantId, userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Count unread notifications for a user.
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { tenantId, userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read. Validates ownership.
   */
  async markAsRead(
    tenantId: string,
    userId: string,
    notificationId: string,
  ) {
    const notification = await this.prisma.inAppNotification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(tenantId: string, userId: string) {
    const result = await this.prisma.inAppNotification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  /**
   * Check if an alert with the same type and matching metadata already exists.
   * Used for idempotent threshold alerts -- prevents duplicate "80% budget warning"
   * alerts for the same budget+category+month.
   */
  async hasExistingAlert(
    tenantId: string,
    type: string,
    metadata: Record<string, unknown>,
  ): Promise<boolean> {
    // Query all alerts of this type for the tenant, then check metadata match in memory.
    // Prisma JSON filtering varies by adapter; this approach is portable.
    const alerts = await this.prisma.inAppNotification.findMany({
      where: { tenantId, type },
      select: { metadata: true },
    });

    return alerts.some((alert) => {
      if (!alert.metadata || typeof alert.metadata !== 'object') return false;
      const alertMeta = alert.metadata as Record<string, unknown>;
      // Check all metadata keys match
      return Object.keys(metadata).every(
        (key) => String(alertMeta[key]) === String(metadata[key]),
      );
    });
  }
}
