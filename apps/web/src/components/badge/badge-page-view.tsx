'use client';

import {
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  MessageCircle,
  Mail,
  Phone,
  Shield,
  ExternalLink,
  Star,
  MessageSquareQuote,
} from 'lucide-react';
import type { PublicBadgeProfile, Testimonial, CustomLink } from '@anchor/shared';
import { INSURANCE_PRODUCTS } from '@anchor/shared';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/badge/star-rating';
import { TestimonialCard } from '@/components/badge/testimonial-card';
import { Button } from '@/components/ui/button';

interface BadgePageViewProps {
  profile: PublicBadgeProfile;
  supabaseUrl: string;
}

const productLabelMap = new Map<string, string>(
  INSURANCE_PRODUCTS.map((p) => [p.value, p.label])
);

/**
 * Generate a lighter tint of a hex color for badge backgrounds.
 * Returns the color with low opacity via rgba.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeAverageRating(testimonials: Testimonial[]): number {
  if (testimonials.length === 0) return 0;
  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return sum / testimonials.length;
}

export function BadgePageView({ profile, supabaseUrl }: BadgePageViewProps) {
  const accent = profile.accentColor || '#0f172a';

  const coverPhotoUrl = profile.coverPhotoPath
    ? `${supabaseUrl}/storage/v1/object/public/badge-assets/${profile.coverPhotoPath}`
    : null;

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http')
        ? profile.avatarUrl
        : `${supabaseUrl}/storage/v1/object/public/avatars/${profile.avatarUrl}`)
    : null;

  const featuredTestimonials = profile.testimonials.filter((t) => t.isFeatured);
  const regularTestimonials = profile.testimonials.filter((t) => !t.isFeatured);
  const avgRating = computeAverageRating(profile.testimonials);

  const customLinks: CustomLink[] = Array.isArray(profile.customLinks)
    ? profile.customLinks
    : [];

  const socialLinks = [
    { url: profile.website, icon: Globe, label: 'Website' },
    { url: profile.linkedIn, icon: Linkedin, label: 'LinkedIn' },
    { url: profile.twitter, icon: Twitter, label: 'X (Twitter)' },
    { url: profile.facebook, icon: Facebook, label: 'Facebook' },
    { url: profile.instagram, icon: Instagram, label: 'Instagram' },
    { url: profile.whatsApp ? `https://wa.me/${profile.whatsApp.replace(/\D/g, '')}` : null, icon: MessageCircle, label: 'WhatsApp' },
  ].filter((link) => link.url);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Cover Banner ─────────────────────────────────── */}
      <div className="relative w-full">
        <div
          className="h-48 w-full sm:h-56 md:h-64"
          style={
            coverPhotoUrl
              ? {
                  backgroundImage: `url(${coverPhotoUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.6)})`,
                }
          }
        />

        {/* Avatar overlapping banner */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.fullName}
              className="size-24 rounded-full border-4 border-background object-cover shadow-lg"
            />
          ) : (
            <div
              className="flex size-24 items-center justify-center rounded-full border-4 border-background text-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: accent }}
            >
              {profile.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* ─── Profile Info ─────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent }}>
          {profile.fullName}
        </h1>
        <p className="mt-1 text-muted-foreground">{profile.agencyName}</p>
        {profile.licenseNumber && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="size-4" />
            <span>License: {profile.licenseNumber}</span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            {profile.bio}
          </p>
        )}
      </div>

      {/* ─── Contact & Social Links ───────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 mt-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <Mail className="size-4" />
              Email
            </a>
          )}
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <Phone className="size-4" />
              Call
            </a>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="flex size-10 items-center justify-center rounded-full border hover:bg-accent transition-colors"
                >
                  <Icon className="size-5" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Products Offered ─────────────────────────────── */}
      {profile.productsOffered.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 mt-8">
          <h2
            className="text-lg font-semibold mb-3"
            style={{ color: accent }}
          >
            Products & Services
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.productsOffered.map((product) => (
              <span
                key={product}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  backgroundColor: hexToRgba(accent, 0.1),
                  color: accent,
                }}
              >
                {productLabelMap.get(product) || product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Custom Links ─────────────────────────────────── */}
      {customLinks.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 mt-8">
          <h2
            className="text-lg font-semibold mb-3"
            style={{ color: accent }}
          >
            Links
          </h2>
          <div className="space-y-2">
            {customLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Featured Testimonials ────────────────────────── */}
      {featuredTestimonials.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 mt-10">
          <div className="space-y-4">
            {featuredTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                variant="featured"
                accentColor={accent}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── All Testimonials ─────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 mt-10 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2
              className="text-lg font-semibold"
              style={{ color: accent }}
            >
              What Clients Say
            </h2>
            {profile.testimonials.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {profile.testimonials.length}
              </span>
            )}
          </div>
          {profile.testimonials.length > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {regularTestimonials.length > 0 ? (
          <div className="grid gap-4">
            {regularTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                variant="standard"
                accentColor={accent}
              />
            ))}
          </div>
        ) : (
          profile.testimonials.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareQuote className="size-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No testimonials yet.</p>
            </div>
          )
        )}
      </div>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t bg-muted/50">
        <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col items-center gap-4">
          <a
            href={`/testimonial/${profile.slug}`}
            className="inline-block"
          >
            <Button
              style={{ backgroundColor: accent }}
              className="text-white hover:opacity-90"
            >
              <MessageSquareQuote className="size-4" />
              Leave a Review
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a href="/" className="underline hover:text-foreground transition-colors">
              Anchor
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
