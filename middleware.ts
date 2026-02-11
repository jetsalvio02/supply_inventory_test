import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const role = req.cookies.get("userRole")?.value;

  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/user");

  if ((isAdminRoute || isUserRoute) && !role) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminRoute && role !== "admin" && role !== "Administrator") {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
