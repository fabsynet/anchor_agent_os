import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();

  // Flow 1: PKCE code exchange (standard login, signup, password reset)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error (code):", error.message);
      if (next === "/update-password") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=link_expired`
        );
      }
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed`
      );
    }

    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/`);
  }

  // Flow 2: Token hash verification (invite, magiclink, recovery emails)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (error) {
      console.error("Auth callback error (token_hash):", error.message);
      if (type === "invite") {
        return NextResponse.redirect(
          `${origin}/login?error=invite_link_expired`
        );
      }
      if (type === "recovery") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=link_expired`
        );
      }
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed`
      );
    }

    // Invite flow: redirect to accept-invite to set password + profile
    if (type === "invite") {
      return NextResponse.redirect(`${origin}/accept-invite`);
    }

    // Recovery flow: redirect to update password
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/update-password`);
    }

    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/`);
  }

  // Fallback: no code or token_hash, redirect to login
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  );
}
