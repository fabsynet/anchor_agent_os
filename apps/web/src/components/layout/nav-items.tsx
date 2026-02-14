'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  CheckSquare,
  FileText,
  DollarSign,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@anchor/shared';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Map icon name strings from NAV_ITEMS to actual lucide-react components.
 */
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Shield,
  CheckSquare,
  FileText,
  DollarSign,
  Settings,
};

interface NavItemsProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavItems({ collapsed = false, onNavigate }: NavItemsProps) {
  const pathname = usePathname();
  const { isAdmin } = useUser();

  return (
    <TooltipProvider>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const isDisabled = item.adminOnly && !isAdmin;

          const buttonContent = (
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 font-normal',
                collapsed && 'justify-center px-0',
                isActive &&
                  'bg-accent text-accent-foreground font-medium',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isDisabled}
              onClick={onNavigate}
              asChild={!isDisabled}
            >
              {isDisabled ? (
                <span className="inline-flex w-full items-center gap-3">
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </span>
              ) : (
                <Link href={item.href}>
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </Button>
          );

          // When collapsed or disabled, wrap in tooltip
          if (collapsed || isDisabled) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent side="right">
                  {isDisabled ? 'Admin only' : item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={item.id}>{buttonContent}</div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
