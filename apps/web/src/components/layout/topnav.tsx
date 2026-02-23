'use client';

import { Menu } from 'lucide-react';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { Button } from '@/components/ui/button';

interface TopnavProps {
  onMobileMenuToggle: () => void;
}

export function Topnav({ onMobileMenuToggle }: TopnavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Hamburger button (mobile only) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
