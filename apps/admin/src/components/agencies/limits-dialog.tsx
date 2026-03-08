'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface LimitsDialogProps {
  agencyId: string;
  agencyName: string;
  currentUserCap: number;
  currentStorageCap: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LimitsDialog({
  agencyId,
  agencyName,
  currentUserCap,
  currentStorageCap,
  open,
  onOpenChange,
  onSuccess,
}: LimitsDialogProps) {
  const [userCap, setUserCap] = useState(currentUserCap);
  const [storageCap, setStorageCap] = useState(currentStorageCap);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUserCap(currentUserCap);
      setStorageCap(currentStorageCap);
    }
  }, [open, currentUserCap, currentStorageCap]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/agencies/${agencyId}/limits`, {
        userCap,
        storageCap,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to update limits:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => !loading && onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border border-[#334155] bg-[#1e293b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">
          Edit Limits for {agencyName}
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Adjust the user and storage caps for this agency.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="user-cap"
              className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
            >
              User Cap (1-50)
            </label>
            <input
              id="user-cap"
              type="number"
              min={1}
              max={50}
              value={userCap}
              onChange={(e) => setUserCap(Number(e.target.value))}
              className="w-full rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div>
            <label
              htmlFor="storage-cap"
              className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
            >
              Storage Cap MB (100-10000)
            </label>
            <input
              id="storage-cap"
              type="number"
              min={100}
              max={10000}
              step={100}
              value={storageCap}
              onChange={(e) => setStorageCap(Number(e.target.value))}
              className="w-full rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-md border border-[#334155] bg-transparent px-4 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
