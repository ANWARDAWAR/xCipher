import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration.
 *
 * This file is imported by `middleware.ts` and must contain ZERO Node.js-only
 * or heavy imports. It must NOT import:
 *   - The Drizzle adapter (`@auth/drizzle-adapter`)
 *   - The database driver (`@/lib/db`)
 *   - `bcrypt-ts` or any password hashing
 *   - `headers()` from `next/headers`
 *   - The rate limiter (`@/lib/rateLimit`)
 *
 * The Credentials provider is intentionally declared with a no-op `authorize`
 * here so that Auth.js recognises the provider shape when verifying JWTs issued
 * by the full config. The *real* authorize logic lives in `lib/auth.ts`, which
 * is only loaded by server actions and API routes — never by the middleware.
 */

function resolveSecureCookies(): boolean {
  const env = process.env;
  return (
    env.NODE_ENV === "production" &&
    !(
      env.NEXTAUTH_URL?.includes("localhost") ||
      env.AUTH_URL?.includes("localhost") ||
      env.NEXT_PUBLIC_SITE_URL?.includes("localhost")
    )
  );
}

export default {
  trustHost: true,
  // The secret must match the full config so JWT verification succeeds.
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    // Stub Credentials so the JWT strategy and provider shape are recognised.
    // The actual authorize() never runs in middleware — middleware only decodes
    // existing JWTs.
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    } as any,
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: resolveSecureCookies()
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: resolveSecureCookies() ? ".xsypher.com" : undefined,
        secure: resolveSecureCookies(),
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl || urlObj.hostname.endsWith(".xsypher.com") || urlObj.hostname.includes("localhost")) {
          return url;
        }
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
    // Must mirror the full config so decoded tokens carry `id`, `role`, etc.
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sessionVersion = token.sessionVersion as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  // Silence stale-JWT warnings that otherwise flood Cloudflare Worker logs.
  logger: {
    error(error: any) {
      if (error?.name === "JWTSessionError") return;
      console.error("[auth][middleware]", error);
    },
    warn(code: string) {
      console.warn("[auth][middleware]", code);
    },
    debug() {
      // noop in middleware
    },
  },
} satisfies NextAuthConfig;
