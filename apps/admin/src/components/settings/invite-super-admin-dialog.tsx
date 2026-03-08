'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { inviteSuperAdminSchema } from '@anchor/shared';
import { api } from '@/lib/api';

interface InviteSuperAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

const inputClass =
  'w-full rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]';

export function InviteSuperAdminDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteSuperAdminDialogProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function handleClose() {
    setEmail('');
    setFirstName('');
    setLastName('');
    setErrors({});
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = inviteSuperAdminSchema.safeParse({
      email,
      firstName,
      lastName,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/super-admins/invite', {
        email,
        firstName,
        lastName,
      });
      toast.success(`Invitation sent to ${email}`);
      handleClose();
      onInvited();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send invitation',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => !submitting && handleClose()}
      />

      <div className="relative z-50 w-full max-w-md rounded-lg border border-[#334155] bg-[#1e293b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">
          Invite Super-Admin
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Send an invitation email to a new super-admin.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className={inputClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="invite-first-name"
                className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
              >
                First Name
              </label>
              <input
                id="invite-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className={inputClass}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="invite-last-name"
                className="mb-1.5 block text-sm font-medium text-[#cbd5e1]"
              >
                Last Name
              </label>
              <input
                id="invite-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className={inputClass}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-md border border-[#334155] bg-transparent px-4 py-2 text-sm font-medium text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
