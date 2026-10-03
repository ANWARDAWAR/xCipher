import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import type { Role } from "@/lib/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth: edgeAuth } = NextAuth(authConfig);

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const hostname = req.headers.get("host") || "";
    const pathname = url.pathname;

    const isLocalDev =
      process.env.IS_LOCAL_DEV === "true" ||
      process.env.NEXTAUTH_URL?.includes("localhost") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      url.hostname.includes("localhost") ||
      url.hostname.includes("127.0.0.1");

    // In local development, ensure the URL retains the local host/port and doesn't get rewritten to live domains
    if (isLocalDev && (url.hostname === "xsypher.com" || url.hostname === "www.xsypher.com" || url.hostname === "admin.xsypher.com")) {
      const localBase = new URL(process.env.NEXTAUTH_URL || "http://localhost:8787");
      url.protocol = localBase.protocol;
      url.hostname = localBase.hostname;
      url.port = localBase.port;
    }
    
    const effectiveHostname = isLocalDev ? url.hostname : hostname;
    const isAdminSubdomain = !isLocalDev && (effectiveHostname === "admin.xsypher.com" || effectiveHostname.startsWith("admin.localhost"));
    const isPreviewSubdomain = !isLocalDev && (effectiveHostname === "preview.xsypher.com" || effectiveHostname.startsWith("preview.localhost"));
    const isApex = !isLocalDev && (effectiveHostname === "xsypher.com" || effectiveHostname === "www.xsypher.com");
    
    let effectivePath = pathname;
    
    // 1. Subdomain rewriting
    if (isAdminSubdomain && !pathname.startsWith("/admin") && !pathname.startsWith("/invite")) {
      effectivePath = `/admin${pathname}`;
    }
    
    // 2. Apex domain redirection for /admin (Production only)
    if (isApex && pathname.startsWith("/admin")) {
      url.hostname = "admin.xsypher.com";
      return NextResponse.redirect(url);
    }
    
    // 3. Authorization guard for protected routes
    const isAuthPublicRoute = 
      effectivePath.startsWith("/admin/login") || 
      effectivePath.startsWith("/admin/setup") ||
      effectivePath.startsWith("/admin/forgot-password") ||
      effectivePath.startsWith("/admin/reset-password");

    const isProtected = effectivePath.startsWith("/admin") && !isAuthPublicRoute;
    // Both editor pages verify the active database user and their capabilities
    // themselves, and the authenticated layout also enforces console access.
    // Keep subdomain routing here without decoding their JWT a second time.
    const editorVerifiesSession =
      (req.method === "GET" || req.method === "HEAD") &&
      (effectivePath === "/admin/editor" || effectivePath.startsWith("/admin/editor/"));

    if (isProtected && !editorVerifiesSession) {
      // Public pages and auth entry points do not need JWT decoding. API
      // handlers are excluded below and verify their own sessions.
      const session = await edgeAuth();
      const token = session?.user;
      if (!token) {
        url.pathname = isAdminSubdomain ? "/login" : "/admin/login";
        url.searchParams.set("callbackUrl", isLocalDev ? `${url.origin}${effectivePath}` : req.url);
        return NextResponse.redirect(url);
      }
      
      // Load the policy only for authenticated console requests; its query
      // scoping helpers should not initialize Drizzle on public page visits.
      const { authorize } = await import("@/lib/capabilities");
      if (!authorize(token.role as Role, "console.access")) {
        url.pathname = "/";
        url.hostname = isApex ? hostname : (process.env.NODE_ENV === "production" && !isLocalDev ? "xsypher.com" : "localhost:3000");
        return NextResponse.redirect(url);
      }
    }
    
    // 4. Perform the rewrite if it's the admin subdomain
    if (isAdminSubdomain && !pathname.startsWith("/admin") && !pathname.startsWith("/invite")) {
      url.pathname = effectivePath;
      return NextResponse.rewrite(url);
    }
    
    // 5. Perform the rewrite if it's the preview subdomain
    if (isPreviewSubdomain && !pathname.startsWith("/preview")) {
      url.pathname = `/preview${pathname}`;
      return NextResponse.rewrite(url);
    }
    
    return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
