import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // If an explicit next param is set (e.g., /update-password), redirect there
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // For new signup email verification: check if user needs setup
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Query the users table to check setup_completed status
      const { data: profile } = await supabase
        .from("users")
        .select("setup_completed")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.setup_completed) {
        // New user or setup not completed — redirect to setup wizard
        return NextResponse.redirect(`${origin}/setup`);
      }

      // Setup already completed — go to dashboard
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Fallback: no code or unknown state, redirect to login
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  );
}
