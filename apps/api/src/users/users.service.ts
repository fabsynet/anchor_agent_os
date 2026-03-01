import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all users belonging to the current tenant.
   * Uses the tenant-scoped Prisma client for automatic filtering.
   */
  async findByTenant() {
    return this.prisma.tenantClient.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a single user by ID (non-tenant-scoped, used for admin lookups).
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user;
  }

  /**
   * Mark a user's setup as completed (after they finish the setup wizard).
   */
  async updateSetupCompleted(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { setupCompleted: true },
    });
  }

  /**
   * Toggle canViewFinancials for a user (admin-only).
   */
  async updateFinancialAccess(userId: string, canViewFinancials: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { canViewFinancials },
    });
  }

  /**
   * Reactivate a deactivated user (admin-only).
   * Sets isActive=true and updates the matching revoked invitation back to accepted.
   */
  async reactivateUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.tenantId !== tenantId) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    // Reactivate the user
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Find and update the matching revoked invitation back to accepted
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        email: user.email.toLowerCase(),
        status: 'revoked',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (invitation) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });
    }

    return updated;
  }
}
