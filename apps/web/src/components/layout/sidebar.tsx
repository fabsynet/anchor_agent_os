'use client';

import { useEffect, useState } from 'react';
import { Anchor, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavItems } from '@/components/layout/nav-items';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const COLLAPSED_KEY = 'anchor-sidebar-collapsed';

interface SidebarProps {
  /** Whether the mobile sheet is open */
  mobileOpen: boolean;
  /** Callback to close the mobile sheet */
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out h-full',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center border-b px-4 shrink-0',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <Anchor className="size-6 shrink-0 text-primary" />
          {!collapsed && (
            <span className="text-lg font-bold text-primary">Anchor</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <div className="border-t p-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              'w-full',
              collapsed ? 'justify-center px-0' : 'justify-start gap-2'
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-4 h-16 flex-row items-center gap-3">
            <Anchor className="size-6 text-primary" />
            <SheetTitle className="text-lg font-bold text-primary">
              Anchor
            </SheetTitle>
          </SheetHeader>
          <div className="px-3 py-4">
            <NavItems onNavigate={onMobileClose} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
