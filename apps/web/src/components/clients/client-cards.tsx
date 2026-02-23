"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  FileText,
  CalendarClock,
  Paperclip,
} from "lucide-react";
import type { ClientListItem, ClientStatus } from "@anchor/shared";

/** Extended client list item with document count from API */
type ClientListItemWithDocs = ClientListItem & {
  documentCount?: number;
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ClientCardsProps {
  data: ClientListItemWithDocs[];
  onDelete: (id: string) => void;
}

function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={status === "client" ? "default" : "secondary"}>
      {status === "client" ? "Client" : "Lead"}
    </Badge>
  );
}

export function ClientCards({ data, onDelete }: ClientCardsProps) {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        No results.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((client) => {
          const fullName = `${client.firstName} ${client.lastName}`;
          const renewalDate = client.nextRenewalDate
            ? (() => {
                try {
                  return format(
                    new Date(client.nextRenewalDate),
                    "MMM d, yyyy"
                  );
                } catch {
                  return null;
                }
              })()
            : null;

          return (
            <Card key={client.id} className="py-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-primary hover:underline"
                  >
                    {fullName}
                  </Link>
                </CardTitle>
                <CardAction>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={client.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Pencil className="size-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteTarget({ id: client.id, name: fullName })
                          }
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    <span>
                      {client.policyCount}{" "}
                      {client.policyCount === 1 ? "policy" : "policies"}
                    </span>
                  </div>
                  {(client.documentCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="size-3.5" />
                      <span>
                        {client.documentCount}{" "}
                        {client.documentCount === 1 ? "doc" : "docs"}
                      </span>
                    </div>
                  )}
                  {renewalDate && (
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      <span>{renewalDate}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>? This
              will also remove all their policies, notes, and activity history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
