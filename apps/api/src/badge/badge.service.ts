import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSupabaseAdmin } from '../common/config/supabase.config.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { SubmitTestimonialDto } from './dto/submit-testimonial.dto.js';
import crypto from 'crypto';

// Badge constants (mirrored from @anchor/shared to avoid cross-package dep)
const MAX_FEATURED_TESTIMONIALS = 2;
const COVER_PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const COVER_PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BADGE_ASSETS_BUCKET = 'badge-assets';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(this.configService);
    this.ensureBucket();
  }

  // ─── Bucket Setup ────────────────────────────────────────

  /**
   * Ensure the badge-assets storage bucket exists as PUBLIC.
   */
  private async ensureBucket() {
    try {
      const { data, error } = await this.supabaseAdmin.storage.getBucket(
        BADGE_ASSETS_BUCKET,
      );
      if (error && error.message?.includes('not found')) {
        const { error: createError } =
          await this.supabaseAdmin.storage.createBucket(BADGE_ASSETS_BUCKET, {
            public: true,
          });
        if (createError) {
          this.logger.warn(
            `Failed to create storage bucket "${BADGE_ASSETS_BUCKET}": ${createError.message}. You may need to create it manually in the Supabase Dashboard.`,
          );
        } else {
          this.logger.log(
            `Storage bucket "${BADGE_ASSETS_BUCKET}" created (public).`,
          );
        }
      } else if (!error && data) {
        this.logger.debug(
          `Storage bucket "${BADGE_ASSETS_BUCKET}" already exists.`,
        );
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not verify storage bucket "${BADGE_ASSETS_BUCKET}": ${err.message}`,
      );
    }
  }

  // ─── Profile Methods ─────────────────────────────────────

  /**
   * 1. Get the authenticated agent's profile, auto-creating if not found.
   */
  async getMyProfile(userId: string, tenantId: string) {
    let profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        testimonials: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      profile = await this.autoCreateProfile(userId, tenantId);
    }

    return profile;
  }

  /**
   * 2. Update the agent's profile. Auto-creates if not found.
   */
  async updateProfile(
    userId: string,
    tenantId: string,
    dto: UpdateProfileDto,
  ) {
    let profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.autoCreateProfile(userId, tenantId);
    }

    const updated = await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.licenseNumber !== undefined && {
          licenseNumber: dto.licenseNumber || null,
        }),
        ...(dto.bio !== undefined && { bio: dto.bio || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.website !== undefined && { website: dto.website || null }),
        ...(dto.linkedIn !== undefined && { linkedIn: dto.linkedIn || null }),
        ...(dto.twitter !== undefined && { twitter: dto.twitter || null }),
        ...(dto.facebook !== undefined && { facebook: dto.facebook || null }),
        ...(dto.instagram !== undefined && {
          instagram: dto.instagram || null,
        }),
        ...(dto.whatsApp !== undefined && { whatsApp: dto.whatsApp || null }),
        ...(dto.productsOffered !== undefined && {
          productsOffered: dto.productsOffered,
        }),
        ...(dto.customLinks !== undefined && {
          customLinks: dto.customLinks as any,
        }),
        ...(dto.accentColor !== undefined && {
          accentColor: dto.accentColor,
        }),
        ...(dto.isPublished !== undefined && {
          isPublished: dto.isPublished,
        }),
      },
    });

    return updated;
  }

  /**
   * Auto-create a profile for a user with a generated slug.
   */
  private async autoCreateProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const firstName = user?.firstName || 'agent';
    const lastName = user?.lastName || '';

    const slug = await this.generateSlug(firstName, lastName);

    return this.prisma.agentProfile.create({
      data: {
        userId,
        tenantId,
        slug,
      },
      include: {
        testimonials: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * 3. Generate a URL-safe slug from first + last name.
   */
  async generateSlug(firstName: string, lastName: string): Promise<string> {
    const raw = `${firstName} ${lastName}`.trim();
    const base = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    return this.ensureUniqueSlug(base || 'agent');
  }

  /**
   * 4. Ensure slug uniqueness by appending -1, -2, etc. if needed.
   */
  async ensureUniqueSlug(
    baseSlug: string,
    excludeProfileId?: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let counter = 0;

    while (true) {
      const existing = await this.prisma.agentProfile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || (excludeProfileId && existing.id === excludeProfileId)) {
        return candidate;
      }

      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  /**
   * 5. Upload a cover photo to Supabase Storage (public bucket).
   */
  async uploadCoverPhoto(
    userId: string,
    tenantId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ) {
    // Validate file type
    if (!COVER_PHOTO_ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${COVER_PHOTO_ALLOWED_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > COVER_PHOTO_MAX_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum of ${COVER_PHOTO_MAX_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Ensure profile exists
    let profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.autoCreateProfile(userId, tenantId);
    }

    // Generate storage path
    const ext = file.originalname.split('.').pop() || 'jpg';
    const uuid = crypto.randomUUID();
    const storagePath = `${tenantId}/${userId}/cover-${uuid}.${ext}`;

    // Delete old cover photo if exists
    if (profile.coverPhotoPath) {
      const { error: deleteError } = await this.supabaseAdmin.storage
        .from(BADGE_ASSETS_BUCKET)
        .remove([profile.coverPhotoPath]);

      if (deleteError) {
        this.logger.warn(
          `Failed to delete old cover photo: ${deleteError.message}`,
        );
      }
    }

    // Upload new cover photo
    const { error: uploadError } = await this.supabaseAdmin.storage
      .from(BADGE_ASSETS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      this.logger.error(`Failed to upload cover photo: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to upload cover photo: ${uploadError.message}`,
      );
    }

    // Update profile with new path
    await this.prisma.agentProfile.update({
      where: { id: profile.id },
      data: { coverPhotoPath: storagePath },
    });

    const publicUrl = this.getPublicUrl(storagePath);

    return { url: publicUrl, path: storagePath };
  }

  /**
   * 6. Get the public URL for a file in the badge-assets bucket.
   */
  getPublicUrl(storagePath: string): string {
    const { data } = this.supabaseAdmin.storage
      .from(BADGE_ASSETS_BUCKET)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  // ─── Testimonial Methods ─────────────────────────────────

  /**
   * 7. Submit a testimonial for an agent (public endpoint, no CLS context).
   * Uses raw this.prisma -- NOT tenantClient.
   */
  async submitTestimonial(slug: string, dto: SubmitTestimonialDto) {
    // Find the agent profile by slug (public, no tenant context)
    const profile = await this.prisma.agentProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        isPublished: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Agent profile not found for slug: ${slug}`);
    }

    if (!profile.isPublished) {
      throw new NotFoundException(`Agent profile not found for slug: ${slug}`);
    }

    // Rate limit: max 1 testimonial per email per agent per 24 hours
    if (dto.authorEmail) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentTestimonial = await this.prisma.testimonial.findFirst({
        where: {
          agentProfileId: profile.id,
          authorEmail: dto.authorEmail,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (recentTestimonial) {
        throw new BadRequestException(
          'You have already submitted a testimonial for this agent in the last 24 hours. Please try again later.',
        );
      }
    }

    // Create testimonial (auto-approved: isVisible defaults to true)
    const testimonial = await this.prisma.testimonial.create({
      data: {
        agentProfileId: profile.id,
        authorName: dto.authorName,
        authorEmail: dto.authorEmail || null,
        isAnonymous: dto.isAnonymous ?? false,
        rating: dto.rating,
        content: dto.content,
        strengths: dto.strengths,
      },
    });

    // Send in-app notification to the agent
    try {
      const authorDisplay = dto.isAnonymous ? 'Someone' : dto.authorName;
      await this.alertsService.create(profile.tenantId, profile.userId, {
        type: 'new_testimonial',
        title: 'New Testimonial Received',
        message: `${authorDisplay} left you a ${dto.rating}-star testimonial.`,
        metadata: {
          testimonialId: testimonial.id,
          authorName: authorDisplay,
          rating: dto.rating,
        },
      });
    } catch (err: any) {
      // Don't fail the testimonial submission if notification fails
      this.logger.warn(
        `Failed to send testimonial notification: ${err.message}`,
      );
    }

    return testimonial;
  }

  /**
   * 8. Get the public badge profile for display (public endpoint, no CLS context).
   */
  async getPublicProfile(slug: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        tenant: {
          select: { name: true },
        },
        testimonials: {
          where: { isVisible: true },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Agent profile not found`);
    }

    // Shape the response as PublicBadgeProfile
    const { user, tenant, ...profileData } = profile;

    return {
      ...profileData,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      agencyName: tenant.name,
      avatarUrl: user.avatarUrl ?? null,
      coverPhotoUrl: profile.coverPhotoPath
        ? this.getPublicUrl(profile.coverPhotoPath)
        : null,
    };
  }

  /**
   * 9. Get all testimonials for the authenticated agent (visible + hidden).
   */
  async getMyTestimonials(userId: string, tenantId: string) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return { data: [], count: 0 };
    }

    const testimonials = await this.prisma.testimonial.findMany({
      where: { agentProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return { data: testimonials, count: testimonials.length };
  }

  /**
   * 10. Toggle testimonial visibility. Hiding a featured one also unfeatures it.
   */
  async toggleTestimonialVisibility(
    userId: string,
    tenantId: string,
    testimonialId: string,
  ) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Agent profile not found');
    }

    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id: testimonialId, agentProfileId: profile.id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    const newIsVisible = !testimonial.isVisible;

    // If hiding a featured testimonial, also unfeature it
    const updateData: any = { isVisible: newIsVisible };
    if (!newIsVisible && testimonial.isFeatured) {
      updateData.isFeatured = false;
    }

    return this.prisma.testimonial.update({
      where: { id: testimonialId },
      data: updateData,
    });
  }

  /**
   * 11. Toggle testimonial featured status. Max 2 featured enforced.
   */
  async toggleTestimonialFeatured(
    userId: string,
    tenantId: string,
    testimonialId: string,
  ) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Agent profile not found');
    }

    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id: testimonialId, agentProfileId: profile.id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    // If we're trying to feature it
    if (!testimonial.isFeatured) {
      // Can't feature a hidden testimonial
      if (!testimonial.isVisible) {
        throw new BadRequestException(
          'Cannot feature a hidden testimonial. Make it visible first.',
        );
      }

      // Check current featured count
      const featuredCount = await this.prisma.testimonial.count({
        where: {
          agentProfileId: profile.id,
          isFeatured: true,
        },
      });

      if (featuredCount >= MAX_FEATURED_TESTIMONIALS) {
        // Auto-unfeature the oldest featured one
        const oldestFeatured = await this.prisma.testimonial.findFirst({
          where: {
            agentProfileId: profile.id,
            isFeatured: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (oldestFeatured) {
          await this.prisma.testimonial.update({
            where: { id: oldestFeatured.id },
            data: { isFeatured: false },
          });
        }
      }
    }

    // Toggle the featured status
    return this.prisma.testimonial.update({
      where: { id: testimonialId },
      data: { isFeatured: !testimonial.isFeatured },
    });
  }

  /**
   * 12. Delete a testimonial. Verifies ownership.
   */
  async deleteTestimonial(
    userId: string,
    tenantId: string,
    testimonialId: string,
  ) {
    const profile = await this.prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Agent profile not found');
    }

    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id: testimonialId, agentProfileId: profile.id },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    await this.prisma.testimonial.delete({
      where: { id: testimonialId },
    });

    return { deleted: true, id: testimonialId };
  }
}
