export interface CustomLink {
  label: string;
  url: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  tenantId: string;
  slug: string;
  licenseNumber: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedIn: string | null;
  twitter: string | null;
  facebook: string | null;
  instagram: string | null;
  whatsApp: string | null;
  productsOffered: string[];
  customLinks: CustomLink[] | null;
  coverPhotoPath: string | null;
  accentColor: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  agentProfileId: string;
  authorName: string;
  authorEmail: string | null;
  isAnonymous: boolean;
  rating: number;
  content: string;
  strengths: string[];
  isVisible: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface PublicBadgeProfile extends AgentProfile {
  /** Agent's full name from User record */
  fullName: string;
  /** Agency name from Tenant record */
  agencyName: string;
  /** Agent's avatar URL from User record */
  avatarUrl: string | null;
  /** Only visible testimonials, most recent first */
  testimonials: Testimonial[];
}

export interface TestimonialWithProfile extends Testimonial {
  agentProfile: Pick<AgentProfile, 'id' | 'slug' | 'userId'>;
}
