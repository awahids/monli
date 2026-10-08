import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppUA } from "@/lib/native";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if environment variables are available
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error("Missing Supabase environment variables in middleware");
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    console.error("Auth error in middleware:", error);
    // Continue without user - will be handled by route protection below
  }

  const protectedPrefixes = [
    "/dashboard",
    "/accounts",
    "/budgets",
    "/transactions",
    "/recurring",
    "/goals",
    "/debts",
    "/wrapped",
    "/reports",
    "/settings",
    "/upgrade",
    "/payments",
    "/changelog",
  ];
  const isProtectedPath = protectedPrefixes.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  const inApp = isAppUA(request.headers.get("user-agent"));

  // The installed app opens on "/": signed-in users go straight to Beranda.
  // The iOS/Android app has no marketing site, so it starts at sign-in.
  if (request.nextUrl.pathname === "/") {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url));
    return inApp ? NextResponse.redirect(new URL("/auth/sign-in", request.url)) : response;
  }

  // App Store and Play rules: no web payments inside the app. PRO is bought on
  // the website and shows up in the app through the same account.
  if (inApp && /^\/(upgrade|payments)(\/|$)/.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/settings", request.url));
  }

  if (isProtectedPath) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
  }

  if (
    (request.nextUrl.pathname.startsWith("/auth/sign-in") ||
      request.nextUrl.pathname.startsWith("/auth/sign-up")) &&
    user
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // "/" on its own: the pattern below needs at least one character.
    "/",
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).+)",
  ],
};
