import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { headers } from "next/headers";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
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
        const emailRl = await checkRateLimit("login:email", credentials.email, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!emailRl.allowed) {
          throw new Error("Invalid email or password");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
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
  session: {
    strategy: "jwt" as const,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: process.env.NODE_ENV === "production" ? ".xsypher.com" : undefined,
        secure: process.env.NODE_ENV === "production",
      }
    }
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl || urlObj.hostname.endsWith(".xsypher.com") || urlObj.hostname.includes("localhost")) {
          return url;
        }
      } catch (e) {
        return baseUrl;
      }
      return baseUrl;
    },
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
