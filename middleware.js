import { NextResponse } from "next/server";
import { verifyToken } from "./utils/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and API routes
  if (pathname === "/admin/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if the path starts with /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      // Redirect to login if no token is present
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      // Verify the token
      const decoded = await verifyToken(token);
      if (!decoded) {
        throw new Error("Invalid token");
      }

      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // If token verification fails, redirect to login
      console.error("Token verification failed:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // For non-admin routes, allow access
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
