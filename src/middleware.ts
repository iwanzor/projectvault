import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login"];
const adminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const isAdmin = (token?.isAdmin as boolean) ?? false;

  // Redirect authenticated users away from login
  if (isLoggedIn && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  if (
    isLoggedIn &&
    !isAdmin &&
    adminRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
