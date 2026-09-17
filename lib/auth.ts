import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
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

// Add type declarations for NextAuth
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
    };
  }
}
