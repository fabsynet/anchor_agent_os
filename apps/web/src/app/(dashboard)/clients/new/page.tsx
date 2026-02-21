"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Client</h1>
          <p className="text-muted-foreground">
            Add a new client or lead to your book of business.
          </p>
        </div>
        <ClientForm mode="create" />
      </div>
    </div>
  );
}
