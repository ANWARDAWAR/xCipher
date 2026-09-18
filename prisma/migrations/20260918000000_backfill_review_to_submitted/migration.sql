-- Backfill the deprecated ArticleStatus.REVIEW value to SUBMITTED.
--
-- REVIEW predates the SUBMITTED / REVISION_REQUESTED / APPROVED workflow and
-- means the same thing SUBMITTED now means. It was kept in the enum with a
-- comment rather than removed, so rows written before the workflow landed can
-- still hold it, and every query that wants "awaiting review" has to remember
-- to match both values.
--
-- This is data-only. The enum value itself is deliberately NOT dropped:
-- removing a value from a Postgres enum requires recreating the type and
-- rewriting every dependent column, which is destructive and needs downtime.
-- Leaving an unused value costs nothing. Application code no longer writes it,
-- so after this migration no row can hold it again.

UPDATE "Article" SET "status" = 'SUBMITTED' WHERE "status" = 'REVIEW';
