import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}

import { cache } from "react";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export const getActor = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) return null;
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      isActive: true,
      authorId: true,
      name: true,
      email: true,
      sessionVersion: true,
    }
  });

  if (!user || !user.isActive || user.sessionVersion !== (session.user as any).sessionVersion) return null;
  return user as { id: string, role: Role, authorId: string | null, name: string | null, email: string | null };
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

// Add type declarations for NextAuth
import "next-auth";

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
