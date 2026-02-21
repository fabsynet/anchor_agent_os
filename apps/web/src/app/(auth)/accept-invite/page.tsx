"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import type { User } from "@supabase/supabase-js";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [agencyName, setAgencyName] = useState<string | undefined>();

  useEffect(() => {
    const supabase = createClient();

    async function initSession() {
      // Supabase invite links redirect with hash fragment tokens:
      // /accept-invite#access_token=...&refresh_token=...&type=invite
      // The SSR client (createBrowserClient) doesn't auto-detect these,
      // so we manually parse and set the session.
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Failed to set session from invite:", error.message);
            router.push("/login?error=invite_session_failed");
            return;
          }

          // Clear the hash from the URL (tokens are sensitive)
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      // Now check for authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?error=invite_auth_required");
        return;
      }

      handleUser(user);
    }

    function handleUser(user: User) {
      const metadata = user.user_metadata;
      if (metadata?.agency_name) {
        setAgencyName(metadata.agency_name);
      }
      setIsLoading(false);
    }

    initSession();
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
