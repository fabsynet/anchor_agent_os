"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@anchor/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

interface ClientProfileHeaderProps {
  client: Client;
  onRefresh: () => void;
}

export function ClientProfileHeader({
  client,
  onRefresh,
}: ClientProfileHeaderProps) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${client.firstName} ${client.lastName}`;
  const isLead = client.status === "lead";

  async function handleConvert() {
    setConverting(true);
    try {
      await api.patch(`/api/clients/${client.id}/convert`);
      toast.success(
        isLead
          ? `${fullName} converted to Client`
          : `${fullName} reverted to Lead`
      );
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update client status"
      );
    } finally {
      setConverting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/api/clients/${client.id}`);
      toast.success(`${fullName} has been deleted`);
      router.push("/clients");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete client"
      );
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Avatar + Name + Contact */}
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {fullName}
            </h1>
            <Badge variant={isLead ? "secondary" : "default"}>
              {isLead ? "Lead" : "Client"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-x-3">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/clients/${client.id}/edit`)}
        >
          <Pencil />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleConvert}
          disabled={converting}
        >
          {converting ? <Loader2 className="animate-spin" /> : <ArrowRightLeft />}
          {isLead ? "Convert to Client" : "Revert to Lead"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {fullName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All policies, notes, and activity
                history associated with this client will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
