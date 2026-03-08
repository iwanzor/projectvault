import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Debug: log all cookies
  const cookies = req.cookies.getAll();
  console.log("[MW] Cookies:", cookies.map(c => c.name).join(", ") || "NONE");
  
  // Get token - use __Secure- prefix for HTTPS (salt must match cookie name)
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    salt: "__Secure-authjs.session-token",
    cookieName: "__Secure-authjs.session-token",
  });
  
  console.log("[MW] Token:", token ? `user=${token.username}` : "NO TOKEN");
  const isLoggedIn = !!token;

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
