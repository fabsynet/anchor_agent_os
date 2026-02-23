import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { PublicBadgeProfile } from '@anchor/shared';
import { BadgePageView } from '@/components/badge/badge-page-view';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

async function getPublicProfile(
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
}: AgentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    return { title: 'Agent Not Found | Anchor' };
  }

  const description = profile.bio
    ? `${profile.fullName} at ${profile.agencyName} - ${profile.bio.slice(0, 150)}`
    : `${profile.fullName} at ${profile.agencyName} - Insurance professional. View testimonials and get in touch.`;

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http')
        ? profile.avatarUrl
        : `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatarUrl}`)
    : undefined;

  const coverUrl = profile.coverPhotoPath
    ? `${SUPABASE_URL}/storage/v1/object/public/badge-assets/${profile.coverPhotoPath}`
    : undefined;

  return {
    title: `${profile.fullName} - Insurance Agent | Anchor`,
    description,
    openGraph: {
      title: `${profile.fullName} - Insurance Agent | Anchor`,
      description,
      images: coverUrl ? [{ url: coverUrl }] : avatarUrl ? [{ url: avatarUrl }] : [],
    },
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    notFound();
  }

  return <BadgePageView profile={profile} supabaseUrl={SUPABASE_URL} />;
}
