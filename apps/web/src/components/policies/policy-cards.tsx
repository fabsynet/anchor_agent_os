"use client";

import { format } from "date-fns";
import {
  Car,
  Home,
  Heart,
  Activity,
  Building2,
  Plane,
  Umbrella,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Policy, PolicyType } from "@anchor/shared";
import { POLICY_TYPES } from "@anchor/shared";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PolicyStatusBadge } from "./policy-status-badge";

interface PolicyCardsProps {
  policies: Policy[];
  clientId: string;
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

const iconMap: Record<PolicyType, React.ComponentType<{ className?: string }>> = {
  auto: Car,
  home: Home,
  life: Heart,
  health: Activity,
  commercial: Building2,
  travel: Plane,
  umbrella: Umbrella,
  other: FileText,
};

function formatCurrency(value: string | null): string {
  if (!value) return "--";
  const num = parseFloat(value);
  if (isNaN(num)) return "--";
  return `$${num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "--";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "--";
  }
}

export function PolicyCards({ policies, onEdit, onDelete }: PolicyCardsProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((policy) => {
        const typeInfo = POLICY_TYPES.find((pt) => pt.value === policy.type);
        const Icon = iconMap[policy.type] ?? FileText;
        const label =
          policy.type === "other" && policy.customType
            ? policy.customType
            : typeInfo?.label ?? policy.type;

        return (
          <Card key={policy.id} className="gap-3">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>
                <PolicyStatusBadge status={policy.status} />
              </div>
              {policy.policyNumber && (
                <p className="text-xs text-muted-foreground">
                  #{policy.policyNumber}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carrier</span>
                <span className="font-medium">{policy.carrier || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Premium</span>
                <span className="font-medium">
                  {formatCurrency(policy.premium)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry</span>
                <span className="font-medium">
                  {formatDate(policy.endDate)}
                </span>
              </div>
            </CardContent>

            <CardFooter className="gap-2 pt-0">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onEdit(policy)}
              >
                <Pencil className="size-3" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(policy)}
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
