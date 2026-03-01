"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { SettingsNav } from "@/components/settings/settings-nav";
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
import { InviteForm } from "@/components/settings/invite-form";
import { PendingInvites } from "@/components/settings/pending-invites";

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

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  canViewFinancials: boolean;
  isActive: boolean;
}

const INVITE_CAP = 2;

export default function TeamSettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isUserLoading } = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-admin users to profile settings
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace("/settings/profile");
    }
  }, [isAdmin, isUserLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [invitationsData, membersData] = await Promise.all([
        api.get<Invitation[]>("/api/invitations"),
        api.get<TeamMember[]>("/api/users"),
      ]);
      setInvitations(invitationsData);
      setMembers(membersData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch team data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, team, and public badge page.
          </p>
        </div>
        <SettingsNav />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Team Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your team members and invitations.
          </p>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  const handleToggleFinancials = async (
    memberId: string,
    currentValue: boolean
  ) => {
    try {
      await api.patch(`/api/users/${memberId}/financial-access`, {
        canViewFinancials: !currentValue,
      });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, canViewFinancials: !currentValue }
            : m
        )
      );
      toast.success(
        `Financial access ${!currentValue ? "granted" : "revoked"}`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update access";
      toast.error(message);
    }
  };

  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const handleReactivate = async (memberId: string) => {
    setReactivatingId(memberId);
    try {
      await api.patch(`/api/users/${memberId}/reactivate`);
      toast.success("Team member reactivated");
      fetchData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reactivate user";
      toast.error(message);
    } finally {
      setReactivatingId(null);
    }
  };

  // Count pending + accepted invitations for cap enforcement
  const activeInviteCount = invitations.filter(
    (inv) => inv.status === "pending" || inv.status === "accepted"
  ).length;
  const remainingInvites = Math.max(0, INVITE_CAP - activeInviteCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, team, and public badge page.
        </p>
      </div>

      <SettingsNav />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Team Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your team members and invitations.
        </p>
      </div>

      <InviteForm
        remainingInvites={remainingInvites}
        onInviteSent={fetchData}
      />

      <PendingInvites invitations={invitations} onUpdate={fetchData} />

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length === 1 ? "" : "s"} in your
            agency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Financials</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className={!member.isActive ? "opacity-60" : undefined}
                  >
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Deactivated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.role === "admin" ? (
                        <span className="text-xs text-muted-foreground">
                          Always
                        </span>
                      ) : !member.isActive ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <button
                          onClick={() =>
                            handleToggleFinancials(
                              member.id,
                              member.canViewFinancials
                            )
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            member.canViewFinancials
                              ? "bg-primary"
                              : "bg-input"
                          }`}
                          role="switch"
                          aria-checked={member.canViewFinancials}
                          aria-label="Can view financials"
                        >
                          <span
                            className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                              member.canViewFinancials
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {!member.isActive && member.role !== "admin" && (
                        <button
                          onClick={() => handleReactivate(member.id)}
                          disabled={reactivatingId === member.id}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          {reactivatingId === member.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                          Reactivate
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
