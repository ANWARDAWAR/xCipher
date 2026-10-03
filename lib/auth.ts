import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { user as userTable, account, session, verificationToken } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { cache } from "react";
import authConfig from "@/lib/auth.config";

// Resolve secrets, cookies and the database adapter after request bindings exist.
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  return {
  // Spread the shared edge config (callbacks, cookies, session, pages, secret, trustHost).
  ...authConfig,
  // Layer on the server-only adapter and the real Credentials provider.
  adapter: DrizzleAdapter(db, { usersTable: userTable, accountsTable: account, sessionsTable: session, verificationTokensTable: verificationToken } as any) as any,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const reqHeaders = await headers();
        const ip = getClientIp(reqHeaders);

        // Throttle by IP
        const ipRl = await checkRateLimit("login:ip", ip, { limit: 20, windowMs: 15 * 60 * 1000 });
        if (!ipRl.allowed) {
          throw new Error("Invalid email or password");
        }

        // Throttle by Email
        const emailRl = await checkRateLimit("login:email", credentials.email as string, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!emailRl.allowed) {
          throw new Error("Invalid email or password");
        }

        let user;
        try {
          const result = await db.select().from(userTable).where(eq(userTable.email, credentials.email as string)).limit(1);
          user = result[0];
        } catch (error) {
          console.error("[auth] Database fetch failed:", error);
          throw new Error("Database connection failed during authentication.");
        }

        if (!user) {
          console.warn(`[auth] No user found for email: ${credentials.email}`);
          throw new Error("Invalid email or password");
        }
        
        if (!user.isActive) {
          console.warn(`[auth] Inactive user attempted login: ${credentials.email}`);
          throw new Error("Account is deactivated.");
        }
        
        if (!user.password) {
          console.warn(`[auth] User has no password set: ${credentials.email}`);
          throw new Error("Invalid email or password");
        }

        // Use the Edge-compatible bcrypt-ts verifier
        let isPasswordValid = false;
        try {
          // Session checks do not need the password hashing implementation.
          const { verifyPassword } = await import("@/lib/crypto");
          isPasswordValid = await verifyPassword(credentials.password as string, user.password);
        } catch (error) {
          console.error("[auth] Password verification failed:", error);
          throw new Error("Password verification failed due to an internal error.");
        }

        if (!isPasswordValid) {
          console.warn(`[auth] Password mismatch for user: ${credentials.email}`);
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  // Override the lightweight logger with the full server-side one.
  logger: {
    error(error: any) {
      // Downgrade JWTSessionError (stale cookies) to warning to avoid polluting Cloudflare logs
      if (error?.name === "JWTSessionError") {
        console.warn("[auth][warn] Stale or invalid JWT cookie detected. User treated as unauthenticated.");
      } else {
        console.error("[auth][error]", error);
      }
    },
    warn(code: string) {
      console.warn("[auth][warn]", code);
    },
    debug(code: string, ...message: any[]) {
      console.debug("[auth][debug]", code, ...message);
    }
  },
  };
});


export async function getSession() {
  return await auth();
}

export const getActor = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) return null;
  
  const [u] = await db.select({
    id: userTable.id,
    role: userTable.role,
    isActive: userTable.isActive,
    authorId: userTable.authorId,
    name: userTable.name,
    email: userTable.email,
    sessionVersion: userTable.sessionVersion,
  }).from(userTable).where(eq(userTable.id, session.user.id)).limit(1);

  if (!u || !u.isActive || u.sessionVersion !== (session.user as any).sessionVersion) return null;
  return u as { id: string, role: any, authorId: string | null, name: string | null, email: string | null };
});

export async function getCurrentUser() {
  return await getActor();
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthenticated. Please sign in.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Unauthorized. Required role: ${allowedRoles.join(" or ")}. Your current role is: ${user.role}`);
  }
  return user;
}

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    sessionVersion?: number;
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
      sessionVersion?: number;
    };
  }
}
