import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, type FileFilterCallback } from 'multer';
import { BadgeService } from './badge.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

const COVER_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('badge')
@UseGuards(JwtAuthGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  // ─── 1. GET /api/badge/profile ──────────────────────────

  /**
   * Get the authenticated agent's badge profile.
   * Auto-creates if not found.
   */
  @Get('profile')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ) {
    return this.badgeService.getMyProfile(user.id, tenantId);
  }

  // ─── 2. PATCH /api/badge/profile ────────────────────────

  /**
   * Update the agent's badge profile.
   */
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.badgeService.updateProfile(user.id, tenantId, dto);
  }

  // ─── 3. POST /api/badge/profile/cover-photo ─────────────

  /**
   * Upload a cover photo for the badge profile.
   */
  @Post('profile/cover-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (
        _req: any,
        file: { mimetype: string; originalname: string },
        cb: FileFilterCallback,
      ) => {
        if (COVER_PHOTO_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed. Allowed: ${COVER_PHOTO_MIME_TYPES.join(', ')}`,
            ) as any,
          );
        }
      },
    }),
  )
  async uploadCoverPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.badgeService.uploadCoverPhoto(user.id, tenantId, file);
  }

  // ─── 4. GET /api/badge/testimonials ─────────────────────

  /**
   * List all testimonials for the agent (visible + hidden).
   */
  @Get('testimonials')
  async getTestimonials(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
  ) {
    return this.badgeService.getMyTestimonials(user.id, tenantId);
  }

  // ─── 5. PATCH /api/badge/testimonials/:id/visibility ────

  /**
   * Toggle testimonial visibility (show/hide).
   */
  @Patch('testimonials/:id/visibility')
  async toggleVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.badgeService.toggleTestimonialVisibility(
      user.id,
      tenantId,
      id,
    );
  }

  // ─── 6. PATCH /api/badge/testimonials/:id/featured ──────

  /**
   * Toggle testimonial featured status (max 2 featured).
   */
  @Patch('testimonials/:id/featured')
  async toggleFeatured(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.badgeService.toggleTestimonialFeatured(
      user.id,
      tenantId,
      id,
    );
  }

  // ─── 7. DELETE /api/badge/testimonials/:id ──────────────

  /**
   * Delete a testimonial.
   */
  @Delete('testimonials/:id')
  async deleteTestimonial(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.badgeService.deleteTestimonial(user.id, tenantId, id);
  }
}
