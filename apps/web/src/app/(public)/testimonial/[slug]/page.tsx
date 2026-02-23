import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { PublicBadgeProfile } from '@anchor/shared';
import { TestimonialForm } from '@/components/badge/testimonial-form';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TestimonialPageProps {
  params: Promise<{ slug: string }>;
}

async function getAgentProfile(
  slug: string
): Promise<PublicBadgeProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/badge/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: TestimonialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAgentProfile(slug);

  if (!profile) {
    return { title: 'Review | Anchor' };
  }

  return {
    title: `Review for ${profile.fullName} | Anchor`,
    description: `Leave a review for ${profile.fullName} at ${profile.agencyName}. Share your experience working with this insurance professional.`,
  };
}

export default async function TestimonialPage({
  params,
}: TestimonialPageProps) {
  const { slug } = await params;
  const profile = await getAgentProfile(slug);

  if (!profile) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http')
        ? profile.avatarUrl
        : `${supabaseUrl}/storage/v1/object/public/avatars/${profile.avatarUrl}`)
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start px-4 py-12">
      {/* Agent Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.fullName}
            className="size-20 rounded-full border-2 border-border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
            {profile.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            Leave a review for {profile.fullName}
          </h1>
          <p className="text-muted-foreground">{profile.agencyName}</p>
        </div>
      </div>

      {/* Testimonial Form */}
      <div className="w-full max-w-lg">
        <TestimonialForm slug={slug} agentName={profile.fullName} />
      </div>
    </div>
  );
}
