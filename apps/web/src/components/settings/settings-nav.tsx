'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { label: 'Team', href: '/settings/team', adminOnly: true },
  { label: 'Profile', href: '/settings/profile', adminOnly: false },
  { label: 'Badge', href: '/settings/badge', adminOnly: false },
  { label: 'Import', href: '/settings/import', adminOnly: false },
];

export function SettingsNav() {
  const pathname = usePathname();
  const { isAdmin } = useUser();

  const visibleTabs = SETTINGS_TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="flex gap-4 border-b overflow-x-auto">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'pb-2 text-sm font-medium transition-colors hover:text-foreground',
            pathname === tab.href
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
