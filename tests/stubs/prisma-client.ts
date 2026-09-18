/**
 * Type-only stand-in for @prisma/client, used by vitest.config.ts.
 *
 * lib/capabilities.ts and lib/workflow.ts import Role and ArticleStatus purely
 * as types, so the unit tests do not need a generated client -- which would
 * otherwise require a network fetch for the Prisma query engine before a single
 * pure function could be tested.
 *
 * These must stay in step with prisma/schema.prisma. They are string unions
 * rather than enums so that a value removed from the schema but still used in
 * a test fails to typecheck.
 */

export type Role =
  | "OWNER"
  | "ADMIN"
  | "EDITOR"
  | "AUTHOR"
  | "REVIEWER"
  | "MODERATOR"
  | "STAFF";

export type ArticleStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "APPROVED"
  | "SCHEDULED"
  | "ARCHIVED";
