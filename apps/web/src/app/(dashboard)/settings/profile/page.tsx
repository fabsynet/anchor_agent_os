'use client';

import { Loader2 } from 'lucide-react';

import { useUser } from '@/hooks/use-user';
import { SettingsNav } from '@/components/settings/settings-nav';
import { ProfileForm } from '@/components/settings/profile-form';

export default function ProfileSettingsPage() {
  const { profile, isLoading, refresh } = useUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and public badge page.
        </p>
      </div>

      <SettingsNav />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Profile Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your personal information and preferences.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : profile ? (
        <ProfileForm profile={profile} onSaved={refresh} />
      ) : (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load profile. Please try refreshing the page.
        </div>
      )}
    </div>
  );
}
