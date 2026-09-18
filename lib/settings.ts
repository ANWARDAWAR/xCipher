import { db } from "@/lib/db";
import {
  DEFAULT_SETTINGS as FALLBACK,
  SETTINGS_ID,
  type ResolvedSettings,
} from "@/lib/settings-defaults";

// ─────────────────────────────────────────────────────────────────────────────
// Publication settings resolver.
//
// The publication's name, description and social handles were compile-time
// constants in lib/seo.ts and app/layout.tsx, so renaming the site or fixing a
// typo in the meta description meant a code change and a deploy. They now live
// in a single-row table.
//
// The important property is that nothing breaks when that row is absent. Every
// field falls back to the constant it replaced, so:
//   • an install that has run the migration but never saved settings,
//   • an install that has not run the migration at all,
//   • and a database that is simply unreachable
// all behave exactly as the hardcoded version did. This is why the read is
// wrapped in a try/catch that swallows: site chrome must not 500 because an
// optional table is missing.
// ─────────────────────────────────────────────────────────────────────────────

/** Treats empty strings as unset. A field cleared in the form should fall back
 *  to the default rather than rendering an empty site name. */
function orFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function nullable(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getPublicationSettings(): Promise<ResolvedSettings> {
  try {
    const row = await db.publicationSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!row) return FALLBACK;

    return {
      siteName: orFallback(row.siteName, FALLBACK.siteName),
      tagline: nullable(row.tagline),
      description: orFallback(row.description, FALLBACK.description),
      logoUrl: nullable(row.logoUrl),
      faviconUrl: nullable(row.faviconUrl),
      twitterHandle: orFallback(row.twitterHandle, FALLBACK.twitterHandle),
      publisherName: orFallback(row.publisherName, FALLBACK.publisherName),
      defaultOgImage: nullable(row.defaultOgImage),
      footerText: nullable(row.footerText),
    };
  } catch (error) {
    // Missing table, unreachable database, anything. The site renders with the
    // values it has always used rather than failing.
    console.error("[settings] falling back to defaults:", error);
    return FALLBACK;
  }
}

// Re-exported so existing imports from "@/lib/settings" keep working.
export { FALLBACK as DEFAULT_SETTINGS, SETTINGS_ID };
export type { ResolvedSettings };
