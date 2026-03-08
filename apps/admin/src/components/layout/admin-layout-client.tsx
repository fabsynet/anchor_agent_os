'use client';

import { ImpersonationProvider } from '@/components/impersonation/impersonation-provider';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';

export function AdminLayoutClient({
  email,
  children,
}: {
  email: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <ImpersonationProvider>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ImpersonationBanner />
          <AdminHeader email={email} />
          <main className="flex-1 overflow-y-auto bg-[#0f172a] p-6">
            {children}
          </main>
        </div>
      </div>
    </ImpersonationProvider>
  );
}
