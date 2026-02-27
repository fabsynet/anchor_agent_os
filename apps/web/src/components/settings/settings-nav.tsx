'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { label: 'Team', href: '/settings/team' },
  { label: 'Profile', href: '/settings/profile' },
  { label: 'Badge', href: '/settings/badge' },
  { label: 'Import', href: '/settings/import' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-4 border-b overflow-x-auto">
      {SETTINGS_TABS.map((tab) => (
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
