import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/verify',
  '/reset-password',
  '/update-password',
  '/accept-invite',
  '/auth/callback',
  '/agent',        // Public badge pages
  '/testimonial',  // Public testimonial submission
];

// Fully public routes that never need auth checks — skip Supabase entirely
const PASSTHROUGH_ROUTES = ['/agent', '/testimonial'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fully public pages: skip all auth checks for best performance and resilience
  if (PASSTHROUGH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Use getUser() not getSession() -- getUser() revalidates the JWT
  // against the Supabase Auth server, preventing token spoofing.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // Redirect unauthenticated users to login for protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages to dashboard
  // Exceptions: pages that need the user authenticated AND on the page simultaneously:
  // - /verify (email verification)
  // - /accept-invite (invitation acceptance)
  // - /update-password (password reset — user is authenticated via recovery code)
  // - /auth/callback (must process auth codes regardless of session state)
  if (
    user &&
    isPublicRoute &&
    pathname !== '/verify' &&
    pathname !== '/update-password' &&
    !pathname.startsWith('/accept-invite') &&
    !pathname.startsWith('/auth/callback')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
