"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Policy, ClientStatus } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ViewToggle, type ViewMode } from "@/components/clients/view-toggle";
import { PolicyForm } from "@/components/policies/policy-form";
import { PolicyCards } from "@/components/policies/policy-cards";
import { PolicyTable } from "@/components/policies/policy-table";

interface ClientPoliciesTabProps {
  clientId: string;
  clientStatus: ClientStatus;
  onClientUpdated: () => void;
}

export function ClientPoliciesTab({
  clientId,
  clientStatus,
  onClientUpdated,
}: ClientPoliciesTabProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      const data = await api.get<Policy[]>(
        `/api/clients/${clientId}/policies`
      );
      setPolicies(data);
    } catch {
      // Silently handle -- empty state will show
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  function handleAddPolicy() {
    setEditingPolicy(null);
    setShowForm(true);
  }

  function handleEdit(policy: Policy) {
    setEditingPolicy(policy);
    setShowForm(true);
  }

  function handleDelete(policy: Policy) {
    setDeleteTarget(policy);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/clients/${clientId}/policies/${deleteTarget.id}`);
      toast.success("Policy deleted");
      setDeleteTarget(null);
      fetchPolicies();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete policy"
      );
    }
  }

  function handleFormSuccess() {
    // If client was a lead and we just created a policy, the backend auto-converts.
    // Refresh client data so the profile header updates.
    if (!editingPolicy && clientStatus === "lead") {
      toast.info("Lead has been converted to Client.");
      onClientUpdated();
    }
    fetchPolicies();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading policies...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Policies</h3>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Button size="sm" onClick={handleAddPolicy}>
            <Plus className="size-4" />
            Add Policy
          </Button>
        </div>
      </div>

      {/* Content */}
      {policies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">
              No policies yet. Add a policy to start tracking coverage.
            </p>
            <Button variant="outline" size="sm" onClick={handleAddPolicy}>
              <Plus className="size-4" />
              Add Policy
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <PolicyCards
          policies={policies}
          clientId={clientId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <PolicyTable
          policies={policies}
          clientId={clientId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Policy Form Dialog */}
      <PolicyForm
        clientId={clientId}
        mode={editingPolicy ? "edit" : "create"}
        defaultValues={editingPolicy ?? undefined}
        policyId={editingPolicy?.id}
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{" "}
              <span className="font-medium">
                {deleteTarget?.type === "other" && deleteTarget?.customType
                  ? deleteTarget.customType
                  : deleteTarget?.type}
              </span>{" "}
              policy
              {deleteTarget?.policyNumber
                ? ` (#${deleteTarget.policyNumber})`
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
