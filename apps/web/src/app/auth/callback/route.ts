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
      // If this was a password recovery flow, redirect back to reset page with helpful message
      if (next === "/update-password") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=link_expired`
        );
      }
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed`
      );
    }

    // If an explicit next param is set (e.g., /update-password), redirect there
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Redirect to dashboard — the client-side useUser hook will
    // check setup_completed via the backend API and redirect to
    // /setup if needed
    return NextResponse.redirect(`${origin}/`);
  }

  // Fallback: no code or unknown state, redirect to login
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  );
}
