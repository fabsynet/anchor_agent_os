import { z } from 'zod';

export const submitTestimonialSchema = z.object({
  authorName: z.string().min(1, 'Name is required').max(100),
  authorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  rating: z.coerce.number().int().min(1).max(5),
  content: z
    .string()
    .min(10, 'Please write at least 10 characters')
    .max(2000),
  strengths: z
    .array(z.string())
    .min(1, 'Select at least one strength')
    .max(5),
});

export const updateAgentProfileSchema = z.object({
  licenseNumber: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  whatsApp: z.string().max(20).optional().or(z.literal('')),
  productsOffered: z.array(z.string()).optional(),
  customLinks: z
    .array(
      z.object({
        label: z.string().min(1).max(50),
        url: z.string().url(),
      }),
    )
    .max(5)
    .optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  isPublished: z.boolean().optional(),
});

export type SubmitTestimonialInput = z.input<typeof submitTestimonialSchema>;
export type UpdateAgentProfileInput = z.input<typeof updateAgentProfileSchema>;
