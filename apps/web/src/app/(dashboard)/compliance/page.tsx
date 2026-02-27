"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  ComplianceFilters,
  type ComplianceFilterState,
} from "@/components/compliance/compliance-filters";
import {
  ComplianceTable,
  type ComplianceEvent,
} from "@/components/compliance/compliance-table";

interface PaginatedComplianceResponse {
  data: ComplianceEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ActionType {
  value: string;
  label: string;
}

interface ClientItem {
  id: string;
  firstName: string;
  lastName: string;
}

interface PolicyItem {
  id: string;
  policyNumber?: string;
  type: string;
  clientId: string;
}

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
}

const LIMIT = 25;

export default function CompliancePage() {
  const [filters, setFilters] = useState<ComplianceFilterState>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] =
    useState<PaginatedComplianceResponse | null>(null);

  // Supporting data for filter dropdowns
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUserFilter, setShowUserFilter] = useState(true);
  const [policies, setPolicies] = useState<PolicyItem[]>([]);

  // Fetch supporting data once on mount
  useEffect(() => {
    async function loadFilterData() {
      try {
        const [actionTypesRes, clientsRes, policiesRes] = await Promise.all([
          api.get<ActionType[]>("/api/compliance/action-types"),
          api.get<{ data: ClientItem[] }>("/api/clients?limit=100"),
          api.get<{ data: PolicyItem[] }>("/api/policies?limit=100"),
        ]);
        setActionTypes(actionTypesRes);
        setClients(clientsRes.data ?? []);
        setPolicies(policiesRes.data ?? []);
      } catch (err) {
        // Non-critical -- filters just won't be populated
        console.error("Failed to load filter data:", err);
      }

      // Fetch users separately since it's admin-only and may 403
      try {
        const usersRes = await api.get<UserItem[]>("/api/users");
        setUsers(usersRes);
        setShowUserFilter(true);
      } catch {
        // 403 or other error -- hide user filter gracefully
        setUsers([]);
        setShowUserFilter(false);
      }
    }

    loadFilterData();
  }, []);

  // Fetch compliance events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(LIMIT));

      if (filters.clientId) params.set("clientId", filters.clientId);
      if (filters.type) params.set("type", filters.type);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.policyId) params.set("policyId", filters.policyId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const result = await api.get<PaginatedComplianceResponse>(
        `/api/compliance?${params.toString()}`
      );
      setResponse(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load compliance events"
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset page when filters change
  const handleFiltersChange = (newFilters: ComplianceFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const data = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable record of all tracked actions
          </p>
        </div>

        {/* Filters */}
        <ComplianceFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          clients={clients}
          users={users}
          actionTypes={actionTypes}
          policies={policies}
          showUserFilter={showUserFilter}
        />

        {/* Table */}
        <ComplianceTable
          data={data}
          total={total}
          page={page}
          limit={LIMIT}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
        />
      </div>
    </div>
  );
}
