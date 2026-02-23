'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SettingsNav } from '@/components/settings/settings-nav';
import { ProfileEditor } from '@/components/badge/profile-editor';
import { TestimonialManager } from '@/components/badge/testimonial-manager';

export default function BadgeSettingsPage() {
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const testimonialLink =
    slug && typeof window !== 'undefined'
      ? `${window.location.origin}/testimonial/${slug}`
      : null;

  const handleCopy = async () => {
    if (!testimonialLink) return;
    try {
      await navigator.clipboard.writeText(testimonialLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and public badge page.
        </p>
      </div>

      {/* Settings sub-nav */}
      <SettingsNav />

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Badge & Testimonials</h2>
        <p className="text-sm text-muted-foreground">
          Configure your public badge page and manage testimonials from clients.
        </p>
      </div>

      {/* Profile Editor */}
      <ProfileEditor onSlugLoaded={setSlug} />

      {/* Testimonial Link Sharing */}
      {slug && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="size-5" />
              Testimonial Collection Link
            </CardTitle>
            <CardDescription>
              Share this link with clients to collect testimonials. Anyone with the
              link can submit a review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                {testimonialLink}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with clients to collect testimonials. They can leave a star
              rating, written review, and select your strengths.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Testimonial Manager */}
      {slug && <TestimonialManager slug={slug} />}
    </div>
  );
}
