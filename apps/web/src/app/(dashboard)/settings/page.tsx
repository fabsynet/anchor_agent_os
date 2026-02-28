"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function SettingsPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAdmin ? "/settings/team" : "/settings/profile");
    }
  }, [isAdmin, isLoading, router]);

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
