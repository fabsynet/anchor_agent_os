"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Shield } from "lucide-react";
import { toast } from "sonner";
import type { PolicyWithClient, PolicyStatus } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/clients/view-toggle";
import { AllPolicyTable } from "./all-policy-table";
import { AllPolicyCards } from "./all-policy-cards";

interface PaginatedResponse {
  data: PolicyWithClient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type StatusTab = "all" | PolicyStatus;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "pending_renewal", label: "Pending Renewal" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const VALID_STATUS_TABS = new Set<string>(STATUS_TABS.map((t) => t.value));

export function PoliciesList() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<StatusTab>(
    initialStatus && VALID_STATUS_TABS.has(initialStatus)
      ? (initialStatus as StatusTab)
      : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<PaginatedResponse | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab !== "all") {
        params.set("status", activeTab);
      }
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      const result = await api.get<PaginatedResponse>(
        `/api/policies?${params.toString()}`
      );
      setResponse(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load policies"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as StatusTab);
    setPage(1);
  };

  const data = response?.data ?? [];
  const totalPages = response?.totalPages ?? 1;

  const emptyMessage = () => {
    if (debouncedSearch.trim()) {
      return "No policies match your search.";
    }
    if (activeTab !== "all") {
      return `No ${activeTab.replace("_", " ")} policies found.`;
    }
    return "No policies found. Create a policy from a client profile to get started.";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Policies</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4">
          <div className="overflow-x-auto">
            <TabsList className="flex-nowrap">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="relative w-full sm:max-w-sm sm:flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client, carrier, or policy #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Content — single TabsContent for all tabs since filtering is server-side */}
        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-2">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <EmptyState message={emptyMessage()} />
            ) : viewMode === "table" ? (
              <AllPolicyTable policies={data} />
            ) : (
              <AllPolicyCards policies={data} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Pagination */}
      {!loading && (response?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {response?.total ?? 0} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Shield className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
