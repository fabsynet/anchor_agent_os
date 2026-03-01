"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";

export interface ComplianceFilterState {
  clientId?: string;
  type?: string;
  userId?: string;
  policyId?: string;
  startDate?: string;
  endDate?: string;
}

interface ComplianceFiltersProps {
  filters: ComplianceFilterState;
  onFiltersChange: (filters: ComplianceFilterState) => void;
  clients: { id: string; firstName: string; lastName: string }[];
  users: { id: string; firstName: string; lastName: string }[];
  actionTypes: { value: string; label: string }[];
  policies: {
    id: string;
    policyNumber?: string;
    type: string;
    clientId: string;
  }[];
  showUserFilter?: boolean;
}

const NONE = "_none";

export function ComplianceFilters({
  filters,
  onFiltersChange,
  clients,
  users,
  actionTypes,
  policies,
  showUserFilter = true,
}: ComplianceFiltersProps) {
  // If a client filter is active, only show policies for that client
  const filteredPolicies = useMemo(() => {
    if (filters.clientId) {
      return policies.filter((p) => p.clientId === filters.clientId);
    }
    return policies;
  }, [policies, filters.clientId]);

  const hasActiveFilters =
    !!filters.clientId ||
    !!filters.type ||
    !!filters.userId ||
    !!filters.policyId ||
    !!filters.startDate ||
    !!filters.endDate;

  const update = (patch: Partial<ComplianceFilterState>) => {
    const next = { ...filters, ...patch };
    // When client changes, clear policyId if the selected policy is not for that client
    if (
      patch.clientId !== undefined &&
      next.policyId &&
      patch.clientId !== filters.clientId
    ) {
      const policyStillValid = policies.some(
        (p) =>
          p.id === next.policyId &&
          (!patch.clientId || p.clientId === patch.clientId)
      );
      if (!policyStillValid) {
        next.policyId = undefined;
      }
    }
    onFiltersChange(next);
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-end gap-3 overflow-x-auto pb-1">
      {/* Client filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Client
        </label>
        <SearchableSelect
          value={filters.clientId || NONE}
          onValueChange={(val) =>
            update({ clientId: val === NONE ? undefined : val })
          }
          placeholder="All Clients"
          className="w-44 h-8 text-xs"
          options={[
            { value: NONE, label: "All Clients" },
            ...clients.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName}`,
            })),
          ]}
        />
      </div>

      {/* Action type filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Action Type
        </label>
        <SearchableSelect
          value={filters.type || NONE}
          onValueChange={(val) =>
            update({ type: val === NONE ? undefined : val })
          }
          placeholder="All Actions"
          className="w-44 h-8 text-xs"
          options={[
            { value: NONE, label: "All Actions" },
            ...actionTypes.map((at) => ({
              value: at.value,
              label: at.label,
            })),
          ]}
        />
      </div>

      {/* User filter (admin-only, hidden if not available) */}
      {showUserFilter && users.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            User
          </label>
          <SearchableSelect
            value={filters.userId || NONE}
            onValueChange={(val) =>
              update({ userId: val === NONE ? undefined : val })
            }
            placeholder="All Users"
            className="w-44 h-8 text-xs"
            options={[
              { value: NONE, label: "All Users" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName}`,
              })),
            ]}
          />
        </div>
      )}

      {/* Linked policy filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Linked Policy
        </label>
        <SearchableSelect
          value={filters.policyId || NONE}
          onValueChange={(val) =>
            update({ policyId: val === NONE ? undefined : val })
          }
          placeholder="All Policies"
          className="w-52 h-8 text-xs"
          options={[
            { value: NONE, label: "All Policies" },
            ...filteredPolicies.map((p) => ({
              value: p.id,
              label: `${p.type.charAt(0).toUpperCase() + p.type.slice(1)}${p.policyNumber ? ` - #${p.policyNumber}` : ""}`,
            })),
          ]}
        />
      </div>

      {/* Date range filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Start Date
        </label>
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) =>
            update({ startDate: e.target.value || undefined })
          }
          className="flex h-8 w-36 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          End Date
        </label>
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) =>
            update({ endDate: e.target.value || undefined })
          }
          className="flex h-8 w-36 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 text-xs"
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
