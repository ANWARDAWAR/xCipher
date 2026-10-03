ALTER TABLE "Article" ADD COLUMN "textContent" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "metaTitle" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "metaDescription" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "ogImage" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "focusKeyword" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "canonicalUrl" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "featuredImageAlt" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "featuredImageCaption" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "featuredImageCredit" text;--> statement-breakpoint
CREATE INDEX "Article_search_idx" ON "Article" USING gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("deck", '') || ' ' || coalesce("textContent", '')));