"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Users } from "lucide-react";

import { api } from "@/lib/api";
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
}

const INVITE_CAP = 2;

export default function TeamSettingsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [invitationsData, membersData] = await Promise.all([
        api.get<Invitation[]>("/api/invitations"),
        api.get<TeamMember[]>("/api/users"),
      ]);
      setInvitations(invitationsData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to fetch team data:", err);
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

  // Count pending + accepted invitations for cap enforcement
  const activeInviteCount = invitations.filter(
    (inv) => inv.status === "pending" || inv.status === "accepted"
  ).length;
  const remainingInvites = Math.max(0, INVITE_CAP - activeInviteCount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
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
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
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
                      {new Date(member.createdAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
