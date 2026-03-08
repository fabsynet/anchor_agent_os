'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { SuperAdminProfile } from '@anchor/shared';
import { SuperAdminList } from '@/components/settings/super-admin-list';
import { InviteSuperAdminDialog } from '@/components/settings/invite-super-admin-dialog';

export default function SettingsPage() {
  const [superAdmins, setSuperAdmins] = useState<SuperAdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');

  // Get the current authenticated admin's ID
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentAdminId(data.user.id);
      }
    });
  }, []);

  const fetchSuperAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<SuperAdminProfile[]>('/admin/super-admins');
      setSuperAdmins(data);
    } catch (err) {
      console.error('Failed to fetch super-admins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuperAdmins();
  }, [fetchSuperAdmins]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Manage platform settings and super-admin team
        </p>
      </div>

      {/* Super-Admin Team Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Super-Admin Team
            </h2>
            <p className="text-sm text-[#94a3b8]">
              {superAdmins.filter((a) => a.isActive).length} active super-admin
              {superAdmins.filter((a) => a.isActive).length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            <UserPlus className="h-4 w-4" />
            Invite Super-Admin
          </button>
        </div>

        {loading ? (
          <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-12 text-center text-[#94a3b8]">
            Loading...
          </div>
        ) : (
          <SuperAdminList
            superAdmins={superAdmins}
            currentAdminId={currentAdminId}
            onRemoved={fetchSuperAdmins}
          />
        )}
      </section>

      <InviteSuperAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={fetchSuperAdmins}
      />
    </div>
  );
}
