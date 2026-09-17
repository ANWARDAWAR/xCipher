"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function setupOwner(email: string, password: string, name: string) {
  try {
    const userCount = await db.user.count();
    
    if (userCount > 0) {
      return { error: "Setup has already been completed." };
    }

    if (!email || !password || password.length < 8) {
      return { error: "Invalid email or password (min 8 characters)." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "OWNER",
      }
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    console.error("Setup error:", error);
    return { error: error.message || "Failed to create owner." };
  }
}
