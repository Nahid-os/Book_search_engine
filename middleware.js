/**
 * Next.js Middleware for handling route protection and redirection
 * based on user authentication status, primarily determined by the presence
 * and value of the 'isAuthenticated' cookie.
 */

import { NextResponse } from "next/server";

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Public routes: these should be accessible regardless of authentication.
  const publicPaths = ["/", "/login", "/register", "/api", "/_next", "/favicon.ico"];

  // Get the authentication cookie
  const authCookie = request.cookies.get("isAuthenticated");
  const isAuth = authCookie && authCookie.value === "true";

  // If user is not authenticated and is trying to access a protected route (e.g. /dashboard),
  // then redirect to /login.
  if (!isAuth && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated and is accessing the home page ("/") without a special query, redirect them to /dashboard.
  if (isAuth && pathname === "/" && !request.nextUrl.searchParams.has("view")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // For all public routes, allow the request.
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // For all other routes, if the user is not authenticated, redirect to /login.
  if (!isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|favicon.ico).*)",
};
