"use client";

import { useState } from "react";
import { Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  createdAt: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface PendingInvitesProps {
  invitations: Invitation[];
  onUpdate: () => void;
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "default";
    case "accepted":
      return "secondary";
    case "revoked":
      return "destructive";
    case "expired":
      return "outline";
    default:
      return "default";
  }
}

export function PendingInvites({ invitations, onUpdate }: PendingInvitesProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  async function handleRevoke(id: string) {
    setActionId(id);
    try {
      await api.patch(`/api/invitations/${id}/revoke`);
      toast.success("Invitation revoked");
      onUpdate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke invitation"
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleResend(id: string) {
    setActionId(id);
    try {
      await api.post(`/api/invitations/${id}/resend`);
      toast.success("Invitation resent");
      onUpdate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invitation"
      );
    } finally {
      setActionId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            No invitations sent yet. Use the form above to invite team members.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          Manage your team invitations. You can revoke pending invitations or
          resend expired ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.email}</TableCell>
                <TableCell className="capitalize">{inv.role}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(inv.status)}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(inv.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {inv.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResend(inv.id)}
                          disabled={actionId === inv.id}
                        >
                          {actionId === inv.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-1 size-4" />
                          )}
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(inv.id)}
                          disabled={actionId === inv.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {actionId === inv.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-1 size-4" />
                          )}
                          Revoke
                        </Button>
                      </>
                    )}
                    {inv.status === "expired" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(inv.id)}
                        disabled={actionId === inv.id}
                      >
                        {actionId === inv.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-1 size-4" />
                        )}
                        Resend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
