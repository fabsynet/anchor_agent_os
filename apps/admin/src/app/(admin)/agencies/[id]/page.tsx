'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, ShieldCheck, Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AgencyDetailTabs } from '@/components/agencies/agency-detail-tabs';
import { SuspendDialog } from '@/components/agencies/suspend-dialog';
import { LimitsDialog } from '@/components/agencies/limits-dialog';
import { ExportButton } from '@/components/agencies/export-button';

interface AgencyDetail {
  id: string;
  name: string;
  province: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  userCap: number;
  storageCap: number;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    deactivatedAt: string | null;
    createdAt: string;
  }[];
  _count: {
    clients: number;
    policies: number;
    tasks: number;
    documents: number;
    expenses: number;
  };
}

export default function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [agency, setAgency] = useState<AgencyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);

  const fetchAgency = useCallback(async () => {
    try {
      const data = await api.get<AgencyDetail>(`/admin/agencies/${id}`);
      setAgency(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agency');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgency();
  }, [fetchAgency]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[#94a3b8]">Loading agency details...</p>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error ?? 'Agency not found'}</p>
        <Link
          href="/agencies"
          className="text-sm text-[#2563eb] hover:underline"
        >
          Back to Agencies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/agencies"
        className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agencies
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{agency.name}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              agency.isSuspended
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {agency.isSuspended ? 'Suspended' : 'Active'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSuspendOpen(true)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              agency.isSuspended
                ? 'border border-emerald-600 text-emerald-400 hover:bg-emerald-600/20'
                : 'border border-red-600 text-red-400 hover:bg-red-600/20'
            }`}
          >
            {agency.isSuspended ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                Unsuspend
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Suspend
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLimitsOpen(true)}
            className="flex items-center gap-2 rounded-md border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-[#334155]"
          >
            <Settings2 className="h-4 w-4" />
            Edit Limits
          </button>

          <ExportButton agencyId={agency.id} agencyName={agency.name} />
        </div>
      </div>

      {/* Tabs */}
      <AgencyDetailTabs agency={agency} />

      {/* Dialogs */}
      <SuspendDialog
        agencyId={agency.id}
        agencyName={agency.name}
        isSuspended={agency.isSuspended}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onSuccess={fetchAgency}
      />

      <LimitsDialog
        agencyId={agency.id}
        agencyName={agency.name}
        currentUserCap={agency.userCap}
        currentStorageCap={agency.storageCap}
        open={limitsOpen}
        onOpenChange={setLimitsOpen}
        onSuccess={fetchAgency}
      />
    </div>
  );
}
