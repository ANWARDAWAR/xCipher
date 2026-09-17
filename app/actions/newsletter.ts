"use server";

import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function subscribeNewsletter(email: string) {
  const result = schema.safeParse({ email });
  if (!result.success) {
    return { success: false, error: "Invalid email address" };
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { success: true, message: "You're on the list." };
}
