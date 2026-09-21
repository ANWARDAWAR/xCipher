"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { isValidSafeUrl, ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import { SETTINGS_ID } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { handleServerError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Publication settings
// ---------------------------------------------------------------------------
// Gated on settings.publication, which the capability map already declares and
// grants to OWNER and ADMIN only. An EDITOR runs the newsroom's content but
// does not get to rename the publication.

export interface PublicationSettingsInput {
  siteName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  twitterHandle?: string;
  publisherName?: string;
  defaultOgImage?: string;
  footerText?: string;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function updatePublicationSettings(input: PublicationSettingsInput) {
  const user = await getCurrentUser();
  if (!user || !authorize(user.role as Role, "settings.publication")) {
    return { success: false, error: "Unauthorized" };
  }

  // Image URLs are rendered into pages and into OpenGraph tags that other sites
  // fetch, so they go through the same domain allowlist the article editor uses
  // rather than being trusted because an admin typed them.
  for (const [label, value] of [
    ["Logo URL", input.logoUrl],
    ["Favicon URL", input.faviconUrl],
    ["Default social image", input.defaultOgImage],
  ] as const) {
    const v = clean(value);
    if (v && !isValidSafeUrl(v, ALLOWED_MEDIA_DOMAINS)) {
      return {
        success: false,
        error: `${label} is invalid or from an unapproved domain.`,
      };
    }
  }

  try {
    const data = {
      siteName: clean(input.siteName),
      tagline: clean(input.tagline),
      description: clean(input.description),
      logoUrl: clean(input.logoUrl),
      faviconUrl: clean(input.faviconUrl),
      twitterHandle: clean(input.twitterHandle),
      publisherName: clean(input.publisherName),
      defaultOgImage: clean(input.defaultOgImage),
      footerText: clean(input.footerText),
      updatedById: user.id,
    };

    // upsert rather than update: the migration creates the table empty on
    // purpose, so the first save is an insert and every later one an update.
    await db.publicationSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_PUBLICATION_SETTINGS",
        entityType: "PublicationSettings",
        entityId: SETTINGS_ID,
        details: { siteName: data.siteName, tagline: data.tagline },
      },
    });

    // These values appear in the root layout's metadata and in the footer on
    // every page, so the whole tree is stale, not one route.
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error: unknown) {
    return handleServerError(error, "Failed to save settings");
  }
}
