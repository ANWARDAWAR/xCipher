import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { siteConfig } from "@/lib/seo";

/**
 * Publication settings moved from compile-time constants into a nullable,
 * single-row table. The migration creates that table empty on purpose, so the
 * overwhelmingly common state -- especially right after deploying -- is "row
 * absent, use the defaults".
 *
 * These tests pin the fallbacks to the values that were previously hardcoded.
 * If they drift, an existing site silently renames itself on deploy.
 */
describe("settings fallbacks preserve the pre-existing site identity", () => {
  it("keeps the site name", () => {
    expect(DEFAULT_SETTINGS.siteName).toBe(siteConfig.name);
  });

  it("keeps the meta description", () => {
    expect(DEFAULT_SETTINGS.description).toBe(siteConfig.description);
  });

  it("keeps the twitter handle and publisher", () => {
    expect(DEFAULT_SETTINGS.twitterHandle).toBe(siteConfig.twitter);
    expect(DEFAULT_SETTINGS.publisherName).toBe(siteConfig.publisher);
  });

  it("reproduces the exact <title> the root layout used to hardcode", () => {
    // Was: "xSypher — Independent Technology News, Analysis and Reviews"
    const title = DEFAULT_SETTINGS.tagline
      ? `${DEFAULT_SETTINGS.siteName} — ${DEFAULT_SETTINGS.tagline}`
      : DEFAULT_SETTINGS.siteName;
    expect(title).toBe("xSypher — Independent Technology News, Analysis and Reviews");
  });

  it("leaves genuinely new fields null rather than inventing content", () => {
    expect(DEFAULT_SETTINGS.logoUrl).toBeNull();
    expect(DEFAULT_SETTINGS.faviconUrl).toBeNull();
    expect(DEFAULT_SETTINGS.footerText).toBeNull();
    expect(DEFAULT_SETTINGS.defaultOgImage).toBeNull();
  });
});
