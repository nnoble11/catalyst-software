import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth checks if Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "your-supabase-url"
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup/founder", "/signup/vc", "/invite/founder", "/invite/vc"];
  const isPublicRoute =
    publicRoutes.some((route) => request.nextUrl.pathname === route) ||
    request.nextUrl.pathname.startsWith("/api/validate-invite-code") ||
    request.nextUrl.pathname.startsWith("/api/redeem-invite-code") ||
    request.nextUrl.pathname.startsWith("/auth/");

  // If not authenticated and trying to access a protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If authenticated, check role-based access
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const pathname = request.nextUrl.pathname;

    // Admin routes - only admin role
    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // VC routes - only vc role
    const vcRoutes = ["/deals", "/lists"];
    if (
      vcRoutes.some((r) => pathname.startsWith(r)) &&
      profile?.role !== "vc" &&
      profile?.role !== "admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (["/login", "/signup/founder", "/signup/vc", "/invite/founder", "/invite/vc"].includes(pathname) || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
