"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { handleServerError } from "@/lib/errors";
import { user } from "@/lib/db/schema";
import { sql } from "drizzle-orm";


export async function setupOwner(email: string, password: string, name: string) {
  if (!email || !password || password.length < 8) {
    return { error: "Invalid email or password (min 8 characters)." };
  }

  try {
    const hashedPassword = await hashPassword(password);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(user);
    
    if (count > 0) {
      throw new Error("Setup has already been completed.");
    }

    const [createdUser] = await db.insert(user).values({
      id: crypto.randomUUID(),
      email,
      name,
      password: hashedPassword,
      role: "OWNER",
    }).returning();

    return { success: true, userId: createdUser.id };
  } catch (error: any) {
    const isExpected = error.message === "Setup has already been completed.";
    return handleServerError(error, isExpected ? error.message : "Failed to create owner.");
  }
}
