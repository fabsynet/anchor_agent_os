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

    // Listen for auth state changes — Supabase client auto-detects
    // hash fragment tokens (#access_token=...&type=invite) from the invite URL
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleUser(session.user);
      }
    });

    // Also check immediately in case session is already established
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        handleUser(user);
      } else {
        // Give Supabase a moment to process hash fragment tokens
        // If still no user after 3 seconds, redirect to login
        setTimeout(async () => {
          const { data: { user: retryUser } } = await supabase.auth.getUser();
          if (!retryUser) {
            router.push("/login?error=invite_auth_required");
          }
        }, 3000);
      }
    });

    function handleUser(user: User) {
      const metadata = user.user_metadata;
      if (metadata?.agency_name) {
        setAgencyName(metadata.agency_name);
      }
      setIsLoading(false);
    }

    return () => {
      subscription.unsubscribe();
    };
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
