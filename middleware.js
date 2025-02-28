// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // Added "/register" to allowed paths
  const allowedPaths = ["/login", "/register", "/api", "/_next", "/favicon.ico"];
  if (allowedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Debug: log all cookies
  console.log("Middleware cookies:", request.cookies.getAll());

  // Check the isAuthenticated cookie
  const authCookie = request.cookies.get("isAuthenticated");
  if (!authCookie || authCookie.value !== "true") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|favicon.ico).*)",
};
