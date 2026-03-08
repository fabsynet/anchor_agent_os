'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SuperAdminProfile } from '@anchor/shared';
import { api } from '@/lib/api';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface SuperAdminListProps {
  superAdmins: SuperAdminProfile[];
  currentAdminId: string;
  onRemoved: () => void;
}

export function SuperAdminList({
  superAdmins,
  currentAdminId,
  onRemoved,
}: SuperAdminListProps) {
  const [removeTarget, setRemoveTarget] = useState<SuperAdminProfile | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/admin/super-admins/${removeTarget.id}`);
      toast.success(
        `${removeTarget.firstName} ${removeTarget.lastName} has been removed`,
      );
      setRemoveTarget(null);
      onRemoved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove super-admin',
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-[#334155] bg-[#1e293b]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {superAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-[#94a3b8]"
                  >
                    No super-admins found.
                  </td>
                </tr>
              ) : (
                superAdmins.map((admin) => {
                  const isSelf = admin.id === currentAdminId;
                  return (
                    <tr
                      key={admin.id}
                      className="border-b border-[#334155] last:border-b-0"
                    >
                      <td className="px-4 py-3 text-[#e2e8f0]">
                        {admin.firstName} {admin.lastName}
                        {isSelf && (
                          <span className="ml-2 rounded bg-[#2563eb]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#60a5fa]">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#94a3b8]">
                        {admin.email}
                      </td>
                      <td className="px-4 py-3">
                        {admin.isActive ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#94a3b8]">
                        {format(new Date(admin.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isSelf && admin.isActive && (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(admin)}
                            className="rounded-md p-1.5 text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400"
                            title="Remove super-admin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove Super-Admin"
        description={
          removeTarget
            ? `Are you sure you want to remove ${removeTarget.firstName} ${removeTarget.lastName}? They will no longer be able to access the admin panel.`
            : ''
        }
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleRemove}
        loading={removing}
      />
    </>
  );
}
