"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// ─────────────────────────────────────────────────────────────────────────────
// First-run owner bootstrap
// ─────────────────────────────────────────────────────────────────────────────
//
// Hardened after the security audit:
//
//   • Validation is a schema, not truthy checks. The owner account controls the
//     entire publication, so its password policy is stricter than a normal
//     invite acceptance (>= 12 chars, letters and digits).
//   • The "first user wins" guarantee now holds at the database, not in a
//     count-then-create gap. The transaction runs at SERIALIZABLE, so two
//     simultaneous setup requests cannot both observe zero users -- Postgres
//     aborts one of them and it lands in the serialization-failure catch.
//   • Attempts are rate-limited per IP. The route has to stay publicly
//     reachable for bootstrap, but it does not have to be freely scriptable.
//   • A successful bootstrap is audit-logged, so a stealthy setup on a
//     deployed instance is at least visible in the admin console.
// ─────────────────────────────────────────────────────────────────────────────

const setupSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email address is required.")
    .max(254),
  name: z.string().trim().min(1, "Your name is required.").max(80),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one digit."),
});

export async function setupOwner(email: string, password: string, name: string) {
  try {
    // Limit: 10 attempts per hour per IP. Generous enough for a human doing
    // initial setup, useless for a script probing a deployed instance.
    const headerList = await headers();
    const ip = getClientIp(headerList);
    const rate = checkRateLimit("setup-owner", ip, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.allowed) {
      return { error: "Too many attempts. Please try again later." };
    }

    const parsed = setupSchema.safeParse({ email, password, name });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await db.$transaction(
      async (tx) => {
        const userCount = await tx.user.count();
        if (userCount > 0) {
          // Thrown and translated below; not returned, so it cannot be
          // confused with a successful-but-empty transaction.
          throw new Error("SETUP_ALREADY_COMPLETED");
        }
        return tx.user.create({
          data: {
            email: parsed.data.email,
            name: parsed.data.name,
            password: hashedPassword,
            role: "OWNER",
          },
        });
      },
      {
        // The whole point: at the default isolation level two concurrent
        // transactions can both count 0 and both insert a second owner. At
        // SERIALIZABLE the second one aborts with a serialization failure and
        // hits the catch below instead.
        isolationLevel: "Serializable",
        maxWait: 5_000,
        timeout: 10_000,
      }
    );

    // Audit row written outside the transaction (setup must not fail because
    // logging did), and without the password hash going anywhere near it.
    try {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "setup.owner.created",
          entityType: "user",
          entityId: user.id,
          details: { email: user.email },
        },
      });
    } catch (auditError) {
      console.error("[setup] audit write failed:", auditError);
    }

    return { success: true, userId: user.id };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SETUP_ALREADY_COMPLETED") {
      return { error: "Setup has already been completed." };
    }
    // Postgres serialization failure: the concurrent setup won the race.
    if (
      error instanceof Error &&
      /could not serialize|serialization/i.test(error.message)
    ) {
      return { error: "Setup has already been completed." };
    }
    console.error("Setup error:", error);
    // No error.message here: internals of a bootstrap failure are not
    // something to hand back to an unauthenticated caller.
    return { error: "Setup failed. Please try again." };
  }
}
