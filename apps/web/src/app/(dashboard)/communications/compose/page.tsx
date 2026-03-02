"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { RECIPIENT_FILTERS } from "@anchor/shared";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
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

interface SendResult {
  sentCount: number;
  failedCount: number;
}

export default function ComposeEmailPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isUserLoading } = useUser();
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.replace("/communications");
    }
  }, [isAdmin, isUserLoading, router]);

  const handleSend = async () => {
    // Validate
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }

    // Confirm
    const confirmed = window.confirm(
      `Are you sure you want to send this email to ${getRecipientLabel(recipientFilter)}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const result = await api.post<SendResult>("/api/communications/send", {
        subject: subject.trim(),
        body: body.trim(),
        recipientFilter,
      });
      toast.success(
        `Email sent to ${result.sentCount} recipient${result.sentCount !== 1 ? "s" : ""}${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ""}`
      );
      router.push("/communications");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send email";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/communications">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
        <p className="text-muted-foreground">
          Send a bulk email to your clients.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
        <AlertTriangle className="size-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Bulk emails are for operational announcements only (e.g., office hours
          changes, important notices). Do not use for marketing or promotional
          content.
        </p>
      </div>

      {/* Compose Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            New Email
          </CardTitle>
          <CardDescription>
            This message will be sent as a service communication from your
            agency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Filter */}
          <div className="space-y-2">
            <Label htmlFor="recipientFilter">Recipients</Label>
            <Select
              value={recipientFilter}
              onValueChange={setRecipientFilter}
            >
              <SelectTrigger id="recipientFilter" className="w-full sm:w-80">
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENT_FILTERS.map((rf) => (
                  <SelectItem key={rf.value} value={rf.value}>
                    {rf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/200 characters
            </p>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={10000}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/10000 characters. This message will be sent as a
              service communication from your agency.
            </p>
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRecipientLabel(filter: string): string {
  const found = RECIPIENT_FILTERS.find((rf) => rf.value === filter);
  return found ? found.label.toLowerCase() : "selected recipients";
}
