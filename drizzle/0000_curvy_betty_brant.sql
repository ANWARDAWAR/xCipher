CREATE TYPE "public"."ArticleStatus" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'SUBMITTED', 'REVISION_REQUESTED', 'REJECTED', 'APPROVED', 'SCHEDULED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."CommentStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('OWNER', 'ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER', 'MODERATOR', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."SubscriberStatus" AS ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');--> statement-breakpoint
CREATE TABLE "_ArticleToTag" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_ArticleToTag_AB_unique" UNIQUE("A","B")
);
--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "Article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"deck" text,
	"contentUrl" text,
	"author" text,
	"role" text,
	"categoryId" text,
	"status" "ArticleStatus" DEFAULT 'DRAFT' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"readingTime" integer DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"img" text,
	"seoTitle" text,
	"seoDesc" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"authorId" text,
	"publishedAt" timestamp (3),
	"scheduledFor" timestamp (3),
	"homepagePlacement" text,
	"previousSlugs" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"approvedAt" timestamp (3),
	"approvedById" text,
	"archivedAt" timestamp (3),
	"reviewedAt" timestamp (3),
	"reviewedById" text,
	"submittedAt" timestamp (3),
	"submittedById" text,
	CONSTRAINT "Article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ArticleReview" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"reviewerId" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"reasonCode" text,
	"fromStatus" text NOT NULL,
	"toStatus" text NOT NULL,
	"passNumber" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ArticleRevision" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"userId" text NOT NULL,
	"notes" text,
	"statusChange" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"contentUrl" text,
	"deck" text,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text,
	"details" json,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Author" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"bio" text,
	"avatar" text,
	"socialLinks" json,
	"joinedAt" timestamp (3) DEFAULT now() NOT NULL,
	"email" text,
	"headline" text,
	"location" text,
	"website" text,
	"overview" text,
	"disclosure" text,
	"expertise" text,
	"previousSlugs" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"publicContact" boolean DEFAULT true NOT NULL,
	"verifiedTitle" boolean DEFAULT false NOT NULL,
	CONSTRAINT "Author_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "BenchmarkLeaderboard" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"subCategory" text NOT NULL,
	"metric" text NOT NULL,
	"topScore" integer NOT NULL,
	"deviceName" text NOT NULL,
	"articleId" text,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "BenchmarkLeaderboard_unique" UNIQUE("category","subCategory","metric")
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"fullTitle" text,
	"description" text,
	"parentId" text,
	CONSTRAINT "Category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"articleSlug" text NOT NULL,
	"displayName" text NOT NULL,
	"emailHash" text NOT NULL,
	"body" text NOT NULL,
	"status" "CommentStatus" DEFAULT 'PENDING' NOT NULL,
	"ipHash" text,
	"userAgent" text,
	"moderatorId" text,
	"moderatorNote" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "Role" DEFAULT 'AUTHOR' NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"invitedBy" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "Invitation_email_unique" UNIQUE("email"),
	CONSTRAINT "Invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"type" text DEFAULT 'SYSTEM' NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PasswordResetToken" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "PasswordResetToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "PublicationSettings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"siteName" text,
	"tagline" text,
	"description" text,
	"logoUrl" text,
	"faviconUrl" text,
	"twitterHandle" text,
	"publisherName" text,
	"defaultOgImage" text,
	"footerText" text,
	"updatedAt" timestamp (3) NOT NULL,
	"updatedById" text
);
--> statement-breakpoint
CREATE TABLE "RateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"actionKey" text NOT NULL,
	"count" integer NOT NULL,
	"resetAt" timestamp (3) NOT NULL,
	CONSTRAINT "RateLimit_actionKey_unique" UNIQUE("actionKey")
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	CONSTRAINT "Session_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "Subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" "SubscriberStatus" DEFAULT 'ACTIVE' NOT NULL,
	"source" text DEFAULT 'HOMEPAGE' NOT NULL,
	"consentAt" timestamp (3) DEFAULT now() NOT NULL,
	"unsubscribeToken" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "Subscriber_email_unique" UNIQUE("email"),
	CONSTRAINT "Subscriber_unsubscribeToken_unique" UNIQUE("unsubscribeToken")
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "Tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp (3),
	"image" text,
	"password" text,
	"role" "Role" DEFAULT 'AUTHOR' NOT NULL,
	"authorId" text,
	"pgpPublicKey" text,
	"notificationPrefs" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"sessionVersion" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_authorId_unique" UNIQUE("authorId")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token"),
	CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_A_Article_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_B_Tag_id_fk" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ArticleReview" ADD CONSTRAINT "ArticleReview_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BenchmarkLeaderboard" ADD CONSTRAINT "BenchmarkLeaderboard_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "_ArticleToTag_B_index" ON "_ArticleToTag" USING btree ("B");--> statement-breakpoint
CREATE INDEX "Article_status_updatedAt_idx" ON "Article" USING btree ("status","updatedAt");--> statement-breakpoint
CREATE INDEX "Article_status_submittedAt_idx" ON "Article" USING btree ("status","submittedAt");--> statement-breakpoint
CREATE INDEX "Article_authorId_status_updatedAt_idx" ON "Article" USING btree ("authorId","status","updatedAt");--> statement-breakpoint
CREATE INDEX "Article_categoryId_status_publishedAt_idx" ON "Article" USING btree ("categoryId","status","publishedAt");--> statement-breakpoint
CREATE INDEX "Article_publishedAt_idx" ON "Article" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "Article_scheduledFor_idx" ON "Article" USING btree ("scheduledFor");--> statement-breakpoint
CREATE INDEX "ArticleReview_articleId_createdAt_idx" ON "ArticleReview" USING btree ("articleId","createdAt");