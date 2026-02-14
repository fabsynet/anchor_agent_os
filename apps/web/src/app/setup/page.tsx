"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { SetupWizard } from "@/components/setup/setup-wizard";

interface UserProfile {
  id: string;
  setupCompleted: boolean;
}

function SetupPageContent() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkSetup() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if setup is already completed
      try {
        const profile = await api.get<UserProfile>("/api/auth/me");
        if (profile?.setupCompleted) {
          router.push("/");
          return;
        }
      } catch {
        // If API call fails, show wizard anyway
      }

      setIsReady(true);
    }

    checkSetup();
  }, [router]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SetupWizard />;
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SetupPageContent />
    </Suspense>
  );
}
