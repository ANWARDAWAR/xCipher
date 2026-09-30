import { NextRequest, NextResponse } from "next/server";
import { runScheduledPublications } from "@/lib/scheduler";

// This route mutates data, so it must never be prerendered or cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ──────────────────────────────────────────────────────────────────────────────
// Cron endpoint: publish articles whose scheduled time has arrived.
// ──────────────────────────────────────────────────────────────────────────────
//
// Authentication is a shared secret in CRON_SECRET, compared in constant time.
// The endpoint is unauthenticated in the session sense -- a cron runner has no
// user -- so the secret is the only thing standing between the public internet
// and a write endpoint.
//
// If CRON_SECRET is unset the route refuses every request. Failing closed is
// the only safe default: an unset variable in production would otherwise leave
// a public write endpoint wide open.
//
// Accepts either `Authorization: Bearer <secret>` (Vercel Cron's format) or
// `x-cron-secret: <secret>` for other runners.
// ──────────────────────────────────────────────────────────────────────────────

function timingSafeEqual(a: string, b: string): boolean {
  // Compares every byte regardless of mismatch position, so response time does
  // not leak how much of the secret was correct.
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) return false;

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const custom = request.headers.get("x-cron-secret");
  const provided = bearer ?? custom;
  if (!provided) return false;

  return timingSafeEqual(provided, secret);
}

async function handle(request: NextRequest) {
  if (!isAuthorised(request)) {
    // No detail in the body: an attacker should not learn whether the secret is
    // configured, only that they are not getting in.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const result = await runScheduledPublications();

    return NextResponse.json({
      ok: true,
      publishedCount: result.published.length,
      failedCount: result.failed.length,
      hasMore: result.hasMore,
      durationMs: Date.now() - startedAt,
      published: result.published.map((a) => ({ id: a.id, slug: a.slug })),
      failed: result.failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/publish-scheduled] run failed:", message);
    // 500 so the cron provider records a failure and retries on its schedule.
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// GET is what Vercel Cron issues. POST is accepted for runners that prefer it.
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
