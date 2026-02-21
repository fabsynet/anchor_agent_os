"use client";

import type { Client } from "@anchor/shared";
import { CANADIAN_PROVINCES } from "@anchor/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Mail, Phone, MapPin, Calendar, Shield, Clock } from "lucide-react";

interface ClientOverviewTabProps {
  client: Client & {
    _count?: {
      policies?: number;
      notes?: number;
      activityEvents?: number;
    };
    policies?: Array<{
      endDate: string | null;
      status: string;
    }>;
  };
}

function getProvinceLabel(code: string | null): string {
  if (!code) return "--";
  const province = CANADIAN_PROVINCES.find((p) => p.value === code);
  return province ? province.label : code;
}

function formatAddress(client: Client): string | null {
  const parts = [
    client.address,
    client.city,
    client.province ? getProvinceLabel(client.province) : null,
    client.postalCode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={value ? "text-sm" : "text-sm text-muted-foreground"}>
          {value ?? "Not provided"}
        </p>
      </div>
    </div>
  );
}

export function ClientOverviewTab({ client }: ClientOverviewTabProps) {
  const policyCount = client._count?.policies ?? 0;

  // Find next renewal date from active/pending_renewal policies
  const now = new Date();
  const renewalDates = (client.policies ?? [])
    .filter(
      (p) =>
        p.endDate &&
        (p.status === "active" || p.status === "pending_renewal") &&
        new Date(p.endDate) >= now
    )
    .map((p) => new Date(p.endDate!))
    .sort((a, b) => a.getTime() - b.getTime());

  const nextRenewalDate = renewalDates.length > 0 ? renewalDates[0] : null;

  const accountAge = formatDistanceToNow(new Date(client.createdAt), {
    addSuffix: false,
  });

  const formattedDob = client.dateOfBirth
    ? format(new Date(client.dateOfBirth), "MMMM d, yyyy")
    : null;

  const formattedAddress = formatAddress(client);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Mail} label="Email" value={client.email} />
          <InfoRow icon={Phone} label="Phone" value={client.phone} />
          <InfoRow icon={MapPin} label="Address" value={formattedAddress} />
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={formattedDob}
          />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            icon={Shield}
            label="Policies"
            value={
              policyCount > 0
                ? `${policyCount} ${policyCount === 1 ? "policy" : "policies"}`
                : "No policies yet"
            }
          />
          <InfoRow
            icon={Calendar}
            label="Next Renewal"
            value={
              nextRenewalDate
                ? format(nextRenewalDate, "MMMM d, yyyy")
                : "No upcoming renewals"
            }
          />
          <InfoRow
            icon={Clock}
            label="Account Age"
            value={accountAge}
          />
        </CardContent>
      </Card>
    </div>
  );
}
