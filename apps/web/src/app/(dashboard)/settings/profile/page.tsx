'use client';

import { SettingsNav } from '@/components/settings/settings-nav';

export default function ProfileSettingsPage() {
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
          Profile management coming soon
        </p>
      </div>
    </div>
  );
}
