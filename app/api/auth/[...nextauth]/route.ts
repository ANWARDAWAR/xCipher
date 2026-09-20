import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  isLoginAllowed,
  recordLoginFailure,
  recordLoginThrottled,
  clearLoginFailures,
  ipFromAuthorizeHeaders,
} from "@/lib/login-throttle";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-auth's req type is not exported cleanly; headers is all we read
      async authorize(credentials, req: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim();
        const ip = ipFromAuthorizeHeaders(req?.headers);
        const userAgent =
          typeof req?.headers?.["user-agent"] === "string"
            ? req.headers["user-agent"]
            : null;

        // Fail fast when the account or the source IP is inside its lockout
        // window -- the bcrypt comparison below is not even attempted. The
        // response is deliberately identical to a wrong password; there is no
        // signal in telling an attacker which scope tripped.
        if (!isLoginAllowed(email, ip)) {
          recordLoginThrottled(email, ip, userAgent);
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password || !user.isActive) {
          recordLoginFailure(email, ip, userAgent);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          recordLoginFailure(email, ip, userAgent);
          return null;
        }

        // A real sign-in resets the account's failure counter: honest users
        // who typoed their way to the edge of the window start clean.
        clearLoginFailures(email);

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
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      } else if (token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id },
            select: { sessionVersion: true, isActive: true, role: true }
          });
          if (!dbUser || !dbUser.isActive || dbUser.sessionVersion !== token.sessionVersion) {
            return {};
          }
          token.role = dbUser.role; // keep role synced
        } catch (e) {
          console.error("JWT verification error", e);
          return {};
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
