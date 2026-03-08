'use client';

import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { api } from '@/lib/api';

interface SuspendDialogProps {
  agencyId: string;
  agencyName: string;
  isSuspended: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SuspendDialog({
  agencyId,
  agencyName,
  isSuspended,
  open,
  onOpenChange,
  onSuccess,
}: SuspendDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm(reason?: string) {
    setLoading(true);
    try {
      if (isSuspended) {
        await api.post(`/admin/agencies/${agencyId}/unsuspend`, {
          reason,
        });
      } else {
        await api.post(`/admin/agencies/${agencyId}/suspend`, {
          reason,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Suspend/unsuspend failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isSuspended ? `Unsuspend ${agencyName}` : `Suspend ${agencyName}`}
      description={
        isSuspended
          ? `This will restore access for all users in ${agencyName}. They will be able to log in and use the platform again.`
          : `This will immediately prevent all users in ${agencyName} from accessing the platform. Existing data will be preserved.`
      }
      confirmText={isSuspended ? 'Unsuspend' : 'Suspend'}
      variant={isSuspended ? 'default' : 'destructive'}
      onConfirm={handleConfirm}
      loading={loading}
      reasonRequired={!isSuspended}
    />
  );
}
