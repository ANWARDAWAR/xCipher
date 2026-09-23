import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const url = req.nextUrl.clone();
    const hostname = req.headers.get("host") || "";
    const pathname = url.pathname;
    
    const isAdminSubdomain = hostname === "admin.xsypher.com" || hostname.startsWith("admin.localhost");
    const isPreviewSubdomain = hostname === "preview.xsypher.com" || hostname.startsWith("preview.localhost");
    const isApex = hostname === "xsypher.com" || hostname === "www.xsypher.com";
    
    let effectivePath = pathname;
    
    // 1. Subdomain rewriting
    if (isAdminSubdomain && !pathname.startsWith("/admin") && !pathname.startsWith("/invite")) {
      effectivePath = `/admin${pathname}`;
    }
    
    // 2. Apex domain redirection for /admin
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
                        
    if (isProtected) {
      if (!token) {
        url.pathname = isAdminSubdomain ? "/login" : "/admin/login";
        url.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(url);
      }
      
      // Reject STAFF from accessing the admin console
      if (token.role === "STAFF") {
        url.pathname = "/";
        url.hostname = isApex ? hostname : (process.env.NODE_ENV === "production" ? "xsypher.com" : "localhost:3000");
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
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware body handle all auth logic and redirects
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
