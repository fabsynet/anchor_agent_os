"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import type { ClientListItem } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "./view-toggle";
import { ClientTable } from "./client-table";
import { ClientCards } from "./client-cards";

interface PaginatedResponse {
  data: ClientListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ClientList() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<"clients" | "leads">("clients");
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

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const status = activeTab === "clients" ? "client" : "lead";
      const params = new URLSearchParams();
      params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      const result = await api.get<PaginatedResponse>(
        `/api/clients?${params.toString()}`
      );
      setResponse(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load clients"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "clients" | "leads");
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/clients/${id}`);
      toast.success("Client deleted");
      fetchClients();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete client"
      );
    }
  };

  const data = response?.data ?? [];
  const totalPages = response?.totalPages ?? 1;

  const emptyMessage = () => {
    if (debouncedSearch.trim()) {
      return "No clients match your search.";
    }
    if (activeTab === "leads") {
      return "No leads yet. Add a lead to start tracking prospects.";
    }
    return "No clients found. Create your first client to get started.";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="size-4" />
            New Client
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Content */}
        <TabsContent value="clients" className="pt-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              message={emptyMessage()}
              showCta={!debouncedSearch.trim()}
            />
          ) : viewMode === "table" ? (
            <ClientTable data={data} onDelete={handleDelete} />
          ) : (
            <ClientCards data={data} onDelete={handleDelete} />
          )}
        </TabsContent>

        <TabsContent value="leads" className="pt-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              message={emptyMessage()}
              showCta={!debouncedSearch.trim()}
            />
          ) : viewMode === "table" ? (
            <ClientTable data={data} onDelete={handleDelete} />
          ) : (
            <ClientCards data={data} onDelete={handleDelete} />
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
      )}
    </div>
  );
}

function EmptyState({
  message,
  showCta,
}: {
  message: string;
  showCta: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
      {showCta && (
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="size-4" />
            New Client
          </Link>
        </Button>
      )}
    </div>
  );
}
