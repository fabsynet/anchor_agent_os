import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <AdminHeader email={user.email} />
        <main className="flex-1 overflow-y-auto bg-[#0f172a] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
