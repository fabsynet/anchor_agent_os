"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EmailLog, EmailType } from "@anchor/shared";
import { EMAIL_TYPES } from "@anchor/shared";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaginatedEmailResponse {
  data: EmailLog[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

function getStatusBadgeVariant(
  status: string
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "sent":
      return "default";
    case "failed":
      return "destructive";
    case "queued":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "sent":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "queued":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
    default:
      return "";
  }
}

function getTypeLabel(type: string): string {
  const found = EMAIL_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

function getTypeBadgeClass(type: string): string {
  switch (type) {
    case "birthday_greeting":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300";
    case "renewal_reminder":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "bulk_announcement":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
    case "digest":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
  }
}

export default function CommunicationsPage() {
  const { isAdmin } = useUser();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("_none");
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<PaginatedEmailResponse | null>(
    null
  );

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(LIMIT));
      if (typeFilter && typeFilter !== "_none") {
        params.set("type", typeFilter);
      }

      const result = await api.get<PaginatedEmailResponse>(
        `/api/communications/history?${params.toString()}`
      );
      setResponse(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load email history"
      );
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const data = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground">
            View sent email history and compose new messages.
          </p>
        </div>
        {isAdmin && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/communications/compose">
              <Mail className="size-4" />
              Compose Email
            </Link>
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <div className="w-56">
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">All Types</SelectItem>
              {EMAIL_TYPES.map((et) => (
                <SelectItem key={et.value} value={et.value}>
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email History Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Mail className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            No emails have been sent yet.
          </p>
          <p className="text-xs text-muted-foreground">
            {isAdmin
              ? "Compose a new email or wait for automated emails to be sent."
              : "Email history will appear here once emails are sent."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.sentAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent text-[10px] font-medium ${getTypeBadgeClass(log.type)}`}
                      >
                        {getTypeLabel(log.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{log.recipientEmail}</span>
                        {log.client && (
                          <span className="text-xs text-muted-foreground">
                            {log.client.firstName} {log.client.lastName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="max-w-xs truncate block"
                        title={log.subject}
                      >
                        {log.subject}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent text-[10px] font-medium capitalize ${getStatusBadgeClass(log.status)}`}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.sentBy
                        ? `${log.sentBy.firstName} ${log.sentBy.lastName}`
                        : "System"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} total email{total !== 1 ? "s" : ""}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
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
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return "--";
  }
}
