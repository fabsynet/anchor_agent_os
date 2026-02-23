import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { BadgeService } from './badge.service.js';
import { SubmitTestimonialDto } from './dto/submit-testimonial.dto.js';

/**
 * Public badge endpoints -- NO authentication required.
 * These are consumed by the public badge page and testimonial submission form.
 */
@Controller('public/badge')
export class BadgePublicController {
  constructor(private readonly badgeService: BadgeService) {}

  // ─── 1. GET /api/public/badge/:slug ─────────────────────

  /**
   * Get an agent's public badge profile for display.
   * Only returns published profiles with visible testimonials.
   */
  @Get(':slug')
  async getPublicProfile(@Param('slug') slug: string) {
    return this.badgeService.getPublicProfile(slug);
  }

  // ─── 2. POST /api/public/badge/:slug/testimonials ───────

  /**
   * Submit a testimonial for an agent.
   * Rate limited: max 1 per email per agent per 24 hours.
   * Returns 201 with created testimonial (minus authorEmail for privacy).
   */
  @Post(':slug/testimonials')
  @HttpCode(201)
  async submitTestimonial(
    @Param('slug') slug: string,
    @Body() dto: SubmitTestimonialDto,
  ) {
    const testimonial = await this.badgeService.submitTestimonial(slug, dto);

    // Strip authorEmail from response for privacy
    const { authorEmail, ...publicTestimonial } = testimonial;
    return publicTestimonial;
  }
}
