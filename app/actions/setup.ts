"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { handleServerError } from "@/lib/errors";

export async function setupOwner(email: string, password: string, name: string) {
  if (!email || !password || password.length < 8) {
    return { error: "Invalid email or password (min 8 characters)." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      
      if (userCount > 0) {
        throw new Error("Setup has already been completed.");
      }

      return await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: "OWNER",
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    const isExpected = error.message === "Setup has already been completed.";
    return handleServerError(error, isExpected ? error.message : "Failed to create owner.");
  }
}
