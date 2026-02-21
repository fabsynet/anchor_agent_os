"use client";

import type { PolicyStatus } from "@anchor/shared";
import { POLICY_STATUSES } from "@anchor/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
  className?: string;
}

const statusConfig: Record<
  PolicyStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  draft: { variant: "secondary" },
  active: { variant: "default" },
  pending_renewal: {
    variant: "outline",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  renewed: { variant: "default" },
  expired: { variant: "destructive" },
  cancelled: {
    variant: "destructive",
    className: "bg-transparent text-destructive border-destructive",
  },
};

export function PolicyStatusBadge({ status, className }: PolicyStatusBadgeProps) {
  const config = statusConfig[status] ?? { variant: "secondary" as const };
  const label =
    POLICY_STATUSES.find((s) => s.value === status)?.label ?? status;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {label}
    </Badge>
  );
}
