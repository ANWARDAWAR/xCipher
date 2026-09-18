-- Publication identity, moved out of hardcoded constants and into the database.
--
-- Deliberately a single-row table. The publication has one identity, so there
-- is no natural key and nothing to look up by; the id defaults to the constant
-- 'singleton' and every read and write targets that row.
--
-- Additive and non-destructive: it creates one empty table and touches nothing
-- else. No row is inserted here on purpose. Every column is nullable and the
-- application falls back to the existing siteConfig values when a field is null
-- or the row is missing entirely, so an install that never opens the settings
-- page -- including one where this migration has run but nothing was saved --
-- behaves exactly as it did before.
--
-- Rollback is DROP TABLE "PublicationSettings"; nothing references it.

CREATE TABLE "PublicationSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteName" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "twitterHandle" TEXT,
    "publisherName" TEXT,
    "defaultOgImage" TEXT,
    "footerText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PublicationSettings_pkey" PRIMARY KEY ("id")
);
