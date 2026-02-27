'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';

import type { UserProfile } from '@anchor/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  digestOptOut: boolean;
}

interface ProfileFormProps {
  profile: UserProfile;
  onSaved: () => Promise<void>;
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      digestOptOut: profile.digestOptOut,
    },
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const digestOptOut = watch('digestOptOut');

  const initials =
    (firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '') || '?';

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await api.patch('/api/auth/me', data);
      toast.success('Profile updated');
      await onSaved();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name and profile details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Role display */}
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="text-base font-medium">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {firstName} {lastName}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName', {
                  required: 'First name is required',
                  maxLength: { value: 100, message: 'Max 100 characters' },
                })}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName', {
                  required: 'Last name is required',
                  maxLength: { value: 100, message: 'Max 100 characters' },
                })}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email is managed through your login provider and cannot be changed
              here.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Manage your notification and email preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digestOptOut">Weekly Digest Email</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your agency&apos;s activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setValue('digestOptOut', !digestOptOut, { shouldDirty: true })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                !digestOptOut ? 'bg-primary' : 'bg-input'
              }`}
              role="switch"
              aria-checked={!digestOptOut}
              aria-label="Weekly digest email"
              id="digestOptOut"
            >
              <span
                className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  !digestOptOut ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
