import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// These stay reachable without logging in — their URLs get submitted to the
// App Store / Play Console listings, which must load without an admin session.
const PUBLIC_PATHS = ["/login", "/privacy-policy", "/terms-of-service", "/support"];

export async function proxy(request: NextRequest) {
  const isPublicPath = PUBLIC_PATHS.includes(request.nextUrl.pathname);
  const isLoginPage = request.nextUrl.pathname === "/login";

  let response = NextResponse.next({ request });

  // Reads/refreshes the Supabase session from cookies. Session lifetime is
  // controlled entirely by Supabase (refresh token keeps it alive across
  // visits) — nothing here logs the admin out except calling signOut().
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = profile?.role === "admin";
  }

  if (!isAdmin && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
