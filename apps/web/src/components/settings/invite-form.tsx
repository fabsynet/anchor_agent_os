"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteFormProps {
  remainingInvites: number;
  onInviteSent: () => void;
}

export function InviteForm({ remainingInvites, onInviteSent }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/invitations", { email: email.trim(), role });
      toast.success("Invitation sent!");
      setEmail("");
      setRole("agent");
      onInviteSent();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = remainingInvites <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>
          {isDisabled
            ? "You have reached the maximum invite limit (2 users)."
            : `Send an invitation to join your agency. ${remainingInvites} invite${remainingInvites === 1 ? "" : "s"} remaining.`}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@agency.ca"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isDisabled || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as "admin" | "agent")}
              disabled={isDisabled || isSubmitting}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isDisabled || isSubmitting || !email.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Send Invitation
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
