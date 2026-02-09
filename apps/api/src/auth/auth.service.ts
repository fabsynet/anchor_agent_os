import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the full user profile by user ID.
   * Includes tenant relation for context.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  /**
   * Update user profile fields (firstName, lastName, avatarUrl).
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; avatarUrl?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { tenant: true },
    });
  }
}
