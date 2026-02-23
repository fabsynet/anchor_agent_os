"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@anchor/shared";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ClientProfileHeader } from "@/components/clients/client-profile-header";
import { ClientOverviewTab } from "@/components/clients/client-overview-tab";
import { ClientTimelineTab } from "@/components/clients/client-timeline-tab";
import { ClientPoliciesTab } from "@/components/clients/client-policies-tab";
import { ClientDocumentsTab } from "@/components/clients/client-documents-tab";
import { ClientComplianceTab } from "@/components/clients/client-compliance-tab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/** Extended client type with computed fields from the API. */
type ClientDetail = Client & {
  _count?: {
    policies?: number;
    notes?: number;
    activityEvents?: number;
  };
  policies?: Array<{
    id: string;
    endDate: string | null;
    status: string;
  }>;
};

function ClientProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-9 w-96" />
      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientNotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-semibold">Client not found</h2>
      <p className="mt-2 text-muted-foreground">
        The client you are looking for does not exist or has been deleted.
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => router.push("/clients")}
      >
        <ArrowLeft />
        Back to Clients
      </Button>
    </div>
  );
}

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      const data = await api.get<ClientDetail>(`/api/clients/${id}`);
      setClient(data);
      setNotFound(false);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("not found") ||
          error.message.includes("404"))
      ) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-6">
        <ClientProfileSkeleton />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="container mx-auto max-w-5xl py-6">
        <ClientNotFound />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/clients")}
        className="gap-1"
      >
        <ArrowLeft className="size-4" />
        Back to Clients
      </Button>

      {/* Profile Header */}
      <ClientProfileHeader client={client} onRefresh={fetchClient} />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="timeline">Timeline / Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ClientOverviewTab client={client} />
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <ClientPoliciesTab
            clientId={id}
            clientStatus={client.status}
            onClientUpdated={fetchClient}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ClientTimelineTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <ClientDocumentsTab clientId={id} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ClientComplianceTab clientId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
