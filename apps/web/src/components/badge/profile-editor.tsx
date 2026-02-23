'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Save,
  ExternalLink,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  MessageCircle,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';

import {
  updateAgentProfileSchema,
  INSURANCE_PRODUCTS,
  ACCENT_COLOR_PRESETS,
} from '@anchor/shared';
import type { AgentProfile } from '@anchor/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CoverPhotoUpload } from './cover-photo-upload';

type ProfileFormData = z.input<typeof updateAgentProfileSchema>;

interface ProfileEditorProps {
  onSlugLoaded?: (slug: string) => void;
}

export function ProfileEditor({ onSlugLoaded }: ProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(updateAgentProfileSchema),
    defaultValues: {
      licenseNumber: '',
      bio: '',
      phone: '',
      email: '',
      website: '',
      linkedIn: '',
      twitter: '',
      facebook: '',
      instagram: '',
      whatsApp: '',
      productsOffered: [],
      customLinks: [],
      accentColor: '#0f172a',
      isPublished: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customLinks',
  });

  const bioValue = form.watch('bio') ?? '';
  const isPublished = form.watch('isPublished');
  const selectedColor = form.watch('accentColor');

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<AgentProfile>('/api/badge/profile');
      setProfile(data);

      // Populate form with existing data
      form.reset({
        licenseNumber: data.licenseNumber ?? '',
        bio: data.bio ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',
        linkedIn: data.linkedIn ?? '',
        twitter: data.twitter ?? '',
        facebook: data.facebook ?? '',
        instagram: data.instagram ?? '',
        whatsApp: data.whatsApp ?? '',
        productsOffered: data.productsOffered ?? [],
        customLinks: (data.customLinks as { label: string; url: string }[]) ?? [],
        accentColor: data.accentColor ?? '#0f172a',
        isPublished: data.isPublished ?? false,
      });

      if (onSlugLoaded) {
        onSlugLoaded(data.slug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [form, onSlugLoaded]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const updated = await api.patch<AgentProfile>('/api/badge/profile', data);
      setProfile(updated);
      toast.success('Profile saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverPhotoChange = (newPath: string | null) => {
    setProfile((prev) => (prev ? { ...prev, coverPhotoPath: newPath } : prev));
  };

  const toggleProduct = (productValue: string) => {
    const current = form.getValues('productsOffered') ?? [];
    const updated = current.includes(productValue)
      ? current.filter((p) => p !== productValue)
      : [...current, productValue];
    form.setValue('productsOffered', updated, { shouldDirty: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const productsOffered = form.watch('productsOffered') ?? [];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Publish Status */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Status</CardTitle>
          <CardDescription>
            Control whether your badge page is visible to the public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Badge Page</Label>
              <p className="text-sm text-muted-foreground">
                {isPublished
                  ? 'Your badge page is live and visible to anyone with the link.'
                  : 'Your badge page is hidden. Publish it to share with clients.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished ?? false}
              aria-label="Publish badge page"
              onClick={() => form.setValue('isPublished', !isPublished, { shouldDirty: true })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isPublished ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  isPublished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {isPublished && profile?.slug && (
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <span className="text-sm text-muted-foreground">Your badge page:</span>
              <a
                href={`/agent/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                /agent/{profile.slug}
              </a>
              <Button type="button" variant="ghost" size="icon-xs" asChild>
                <a href={`/agent/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Photo</CardTitle>
          <CardDescription>
            Upload a banner image for your badge page. Recommended aspect ratio 3:1. Max 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoverPhotoUpload
            currentPhotoPath={profile?.coverPhotoPath ?? null}
            onUpload={handleCoverPhotoChange}
          />
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Info</CardTitle>
          <CardDescription>
            Basic details displayed on your badge page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="e.g. ON-12345"
              {...form.register('licenseNumber')}
            />
            {form.formState.errors.licenseNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.licenseNumber.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground">{bioValue.length}/500</span>
            </div>
            <Textarea
              id="bio"
              placeholder="Tell clients about yourself and your expertise..."
              maxLength={500}
              {...form.register('bio')}
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Public Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="public@email.com"
                {...form.register('email')}
              />
              <p className="text-xs text-muted-foreground">Displayed on your badge page</p>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...form.register('phone')}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Connect your social profiles so clients can find you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="size-4" /> Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                {...form.register('website')}
              />
              {form.formState.errors.website && (
                <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkedIn" className="flex items-center gap-2">
                <Linkedin className="size-4" /> LinkedIn
              </Label>
              <Input
                id="linkedIn"
                type="url"
                placeholder="https://linkedin.com/in/yourname"
                {...form.register('linkedIn')}
              />
              {form.formState.errors.linkedIn && (
                <p className="text-sm text-destructive">{form.formState.errors.linkedIn.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="size-4" /> Twitter / X
              </Label>
              <Input
                id="twitter"
                type="url"
                placeholder="https://x.com/yourhandle"
                {...form.register('twitter')}
              />
              {form.formState.errors.twitter && (
                <p className="text-sm text-destructive">{form.formState.errors.twitter.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="size-4" /> Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/yourpage"
                {...form.register('facebook')}
              />
              {form.formState.errors.facebook && (
                <p className="text-sm text-destructive">{form.formState.errors.facebook.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="size-4" /> Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                placeholder="https://instagram.com/yourprofile"
                {...form.register('instagram')}
              />
              {form.formState.errors.instagram && (
                <p className="text-sm text-destructive">{form.formState.errors.instagram.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsApp" className="flex items-center gap-2">
                <MessageCircle className="size-4" /> WhatsApp
              </Label>
              <Input
                id="whatsApp"
                placeholder="+1 (555) 123-4567"
                {...form.register('whatsApp')}
              />
              {form.formState.errors.whatsApp && (
                <p className="text-sm text-destructive">{form.formState.errors.whatsApp.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Offered */}
      <Card>
        <CardHeader>
          <CardTitle>Products Offered</CardTitle>
          <CardDescription>
            Select the types of insurance you sell. Displayed on your badge page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {INSURANCE_PRODUCTS.map((product) => {
              const isSelected = productsOffered.includes(product.value);
              return (
                <button
                  key={product.value}
                  type="button"
                  onClick={() => toggleProduct(product.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-accent'
                  }`}
                  aria-pressed={isSelected}
                >
                  {product.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Links */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Links</CardTitle>
          <CardDescription>
            Add up to 5 external links (booking page, personal website, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <div>
                  <Input
                    placeholder="Label"
                    {...form.register(`customLinks.${index}.label`)}
                  />
                  {form.formState.errors.customLinks?.[index]?.label && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.customLinks[index].label.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="url"
                    placeholder="https://..."
                    {...form.register(`customLinks.${index}.url`)}
                  />
                  {form.formState.errors.customLinks?.[index]?.url && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.customLinks[index].url.message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: '', url: '' })}
            disabled={fields.length >= 5}
          >
            <Plus className="size-4" />
            Add Link
          </Button>
          {fields.length >= 5 && (
            <p className="text-xs text-muted-foreground">Maximum 5 custom links</p>
          )}
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose a color theme for your badge page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLOR_PRESETS.map((color) => {
              const isSelected = selectedColor === color.value;
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => form.setValue('accentColor', color.value, { shouldDirty: true })}
                  className={`relative size-10 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected ? 'ring-2 ring-ring ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <Check className="absolute inset-0 m-auto size-5 text-white drop-shadow-md" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedColor && (
            <div
              className="h-2 w-full rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
