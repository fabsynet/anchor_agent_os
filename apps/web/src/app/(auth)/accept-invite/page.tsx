"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [agencyName, setAgencyName] = useState<string | undefined>();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // User is not authenticated yet - redirect to login
        router.push("/login?error=invite_auth_required");
        return;
      }

      // Get agency name from user metadata (set by inviteUserByEmail)
      const metadata = user.user_metadata;
      if (metadata?.agency_name) {
        setAgencyName(metadata.agency_name);
      }

      setIsLoading(false);
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {agencyName ? `Join ${agencyName}` : "Accept Invitation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete your account setup to get started
        </p>
      </div>
      <AcceptInviteForm agencyName={agencyName} />
    </div>
  );
}
