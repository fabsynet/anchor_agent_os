"use client";

import { useState } from "react";
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
  Eye,
} from "lucide-react";
import type { Policy, PolicyType } from "@anchor/shared";
import { POLICY_TYPES } from "@anchor/shared";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PolicyStatusBadge } from "./policy-status-badge";
import { PolicyDocumentSection } from "./policy-document-section";

/** Extended policy with document count from API */
type PolicyWithCounts = Policy & {
  _count?: { documents: number };
};

interface PolicyCardsProps {
  policies: PolicyWithCounts[];
  clientId: string;
  onEdit: (policy: PolicyWithCounts) => void;
  onDelete: (policy: PolicyWithCounts) => void;
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

export function PolicyCards({ policies, clientId, onEdit, onDelete }: PolicyCardsProps) {
  const [viewingPolicy, setViewingPolicy] = useState<PolicyWithCounts | null>(null);

  if (policies.length === 0) {
    return null;
  }

  // Compute label for viewing policy (used in dialog title)
  const viewingLabel = viewingPolicy
    ? viewingPolicy.type === "other" && viewingPolicy.customType
      ? viewingPolicy.customType
      : POLICY_TYPES.find((pt) => pt.value === viewingPolicy.type)?.label ?? viewingPolicy.type
    : "";

  return (
    <>
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
                {(policy._count?.documents ?? 0) > 0 && (
                  <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                    <FileText className="size-3" />
                    <span>
                      {policy._count!.documents}{" "}
                      {policy._count!.documents === 1 ? "doc" : "docs"}
                    </span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setViewingPolicy(policy)}
                >
                  <Eye className="size-3" />
                  View
                </Button>
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

      {/* Policy detail dialog */}
      <Dialog
        open={!!viewingPolicy}
        onOpenChange={(open) => {
          if (!open) setViewingPolicy(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingLabel}
              {viewingPolicy?.policyNumber
                ? ` - #${viewingPolicy.policyNumber}`
                : " - Details"}
            </DialogTitle>
          </DialogHeader>

          {viewingPolicy && (
            <>
              {/* Policy details summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <PolicyStatusBadge status={viewingPolicy.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier</span>
                  <span>{viewingPolicy.carrier || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Premium</span>
                  <span>{formatCurrency(viewingPolicy.premium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage</span>
                  <span>{formatCurrency(viewingPolicy.coverageAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deductible</span>
                  <span>{formatCurrency(viewingPolicy.deductible)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{formatDate(viewingPolicy.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry Date</span>
                  <span>{formatDate(viewingPolicy.endDate)}</span>
                </div>
                {viewingPolicy.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-1">{viewingPolicy.notes}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Documents section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Documents</h3>
                <PolicyDocumentSection
                  clientId={clientId}
                  policyId={viewingPolicy.id}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
