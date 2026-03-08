'use client';

import { useState } from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
  onConfirm: (reason?: string) => void | Promise<void>;
  loading?: boolean;
  reasonRequired?: boolean;
}

const variantStyles = {
  destructive: {
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: 'text-red-400',
  },
  warning: {
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: 'text-amber-400',
  },
  default: {
    button: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white',
    icon: 'text-[#60a5fa]',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
  reasonRequired = false,
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  const styles = variantStyles[variant];
  const canConfirm = !reasonRequired || reason.trim().length > 0;

  async function handleConfirm() {
    await onConfirm(reasonRequired ? reason.trim() : undefined);
    setReason('');
  }

  function handleCancel() {
    setReason('');
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => !loading && handleCancel()}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg border border-[#334155] bg-[#1e293b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-[#94a3b8]">{description}</p>

        {reasonRequired && (
          <div className="mt-4">
            <label
              htmlFor="confirmation-reason"
              className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
            >
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              id="confirmation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason..."
              rows={3}
              className="w-full rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md border border-[#334155] bg-transparent px-4 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles.button}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
