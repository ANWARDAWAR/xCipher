import { siteConfig } from "@/lib/seo";

// Split out from lib/settings.ts so the defaults can be imported -- and tested
// -- without pulling in the Prisma client. settings.ts imports db at module
// scope, which is correct for a server module but makes the constants
// unreachable from a unit test that has no database.

export interface ResolvedSettings {
  siteName: string;
  tagline: string | null;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  twitterHandle: string;
  publisherName: string;
  defaultOgImage: string | null;
  footerText: string | null;
}

export const SETTINGS_ID = "singleton";

export const DEFAULT_SETTINGS: ResolvedSettings = {
  siteName: siteConfig.name,
  // The exact tagline that was previously baked into the root layout's title.
  // Keeping it as the fallback means an unconfigured install renders the same
  // <title> it always has, byte for byte.
  tagline: "Independent Technology News, Analysis and Reviews",
  description: siteConfig.description,
  logoUrl: null,
  faviconUrl: null,
  twitterHandle: siteConfig.twitter,
  publisherName: siteConfig.publisher,
  defaultOgImage: null,
  footerText: null,
};
