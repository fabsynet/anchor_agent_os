"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/clients/client-form";

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const result = await api.get<Client>(`/api/clients/${id}`);
        setClient(result);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load client"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-6">
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto max-w-2xl py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="size-4" />
              Back to clients
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clients/${id}`}>
            <ArrowLeft className="size-4" />
            Back to client
          </Link>
        </Button>
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">
            Update {client.firstName} {client.lastName}&apos;s information.
          </p>
        </div>
        <ClientForm
          mode="edit"
          clientId={id}
          defaultValues={{
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email ?? "",
            phone: client.phone ?? "",
            status: client.status,
            address: client.address ?? "",
            city: client.city ?? "",
            province: client.province ?? "",
            postalCode: client.postalCode ?? "",
            dateOfBirth: client.dateOfBirth ?? "",
          }}
        />
      </div>
    </div>
  );
}
