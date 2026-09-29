import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd()); // Load Next.js .env files

import * as schema from "../lib/db/schema";

async function migrateData() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  const newUrl = process.env.DATABASE_URL;

  if (!oldUrl || !newUrl) {
    throw new Error("Missing OLD_DATABASE_URL or DATABASE_URL in environment variables.");
  }

  console.log("Connecting to old Supabase database...");
  const oldClient = postgres(oldUrl, { prepare: false });
  const oldDb = drizzlePostgres(oldClient, { schema });

  console.log("Connecting to new Neon database...");
  const newClient = neon(newUrl);
  const newDb = drizzleNeon(newClient, { schema });

  try {
    console.log("Starting data migration...");

    // 1. Users
    console.log("Migrating Users...");
    const users = await oldDb.select().from(schema.user);
    if (users.length > 0) {
      await newDb.insert(schema.user).values(users).onConflictDoNothing();
      console.log(`Migrated ${users.length} users.`);
    }

    // 2. Authors
    console.log("Migrating Authors...");
    const authors = await oldDb.select().from(schema.author);
    if (authors.length > 0) {
      const sanitizedAuthors = authors.map(author => ({
        ...author,
        previousSlugs: author.previousSlugs || [],
      }));
      await newDb.insert(schema.author).values(sanitizedAuthors).onConflictDoNothing();
      console.log(`Migrated ${sanitizedAuthors.length} authors.`);
    }

    // 3. Categories
    console.log("Migrating Categories...");
    const categories = await oldDb.select().from(schema.category);
    if (categories.length > 0) {
      await newDb.insert(schema.category).values(categories).onConflictDoNothing();
      console.log(`Migrated ${categories.length} categories.`);
    }

    // 4. Tags
    console.log("Migrating Tags...");
    const tags = await oldDb.select().from(schema.tag);
    if (tags.length > 0) {
      await newDb.insert(schema.tag).values(tags).onConflictDoNothing();
      console.log(`Migrated ${tags.length} tags.`);
    }

    // 5. PublicationSettings
    console.log("Migrating PublicationSettings...");
    const settings = await oldDb.select().from(schema.publicationSettings);
    if (settings.length > 0) {
      await newDb.insert(schema.publicationSettings).values(settings).onConflictDoNothing();
      console.log(`Migrated ${settings.length} publication settings.`);
    }
    
    // Accounts
    console.log("Migrating Accounts...");
    const accounts = await oldDb.select().from(schema.account);
    if (accounts.length > 0) {
      await newDb.insert(schema.account).values(accounts).onConflictDoNothing();
      console.log(`Migrated ${accounts.length} accounts.`);
    }

    // 6. Articles
    console.log("Migrating Articles...");
    const articles = await oldDb.select().from(schema.article);
    if (articles.length > 0) {
      const sanitizedArticles = articles.map(article => ({
        ...article,
        legacyTags: article.legacyTags || [],
        previousSlugs: article.previousSlugs || [],
      }));
      await newDb.insert(schema.article).values(sanitizedArticles).onConflictDoNothing();
      console.log(`Migrated ${sanitizedArticles.length} articles.`);
    }

    // 7. _ArticleToTag
    console.log("Migrating Article Tags...");
    const articleTags = await oldDb.select().from(schema._articleToTag);
    if (articleTags.length > 0) {
      await newDb.insert(schema._articleToTag).values(articleTags).onConflictDoNothing();
      console.log(`Migrated ${articleTags.length} article-tag relationships.`);
    }

    // 8. ArticleRevisions
    console.log("Migrating Article Revisions...");
    const revisions = await oldDb.select().from(schema.articleRevision);
    if (revisions.length > 0) {
      await newDb.insert(schema.articleRevision).values(revisions).onConflictDoNothing();
      console.log(`Migrated ${revisions.length} article revisions.`);
    }

    // 9. ArticleReview
    console.log("Migrating Article Reviews...");
    const reviews = await oldDb.select().from(schema.articleReview);
    if (reviews.length > 0) {
      await newDb.insert(schema.articleReview).values(reviews).onConflictDoNothing();
      console.log(`Migrated ${reviews.length} article reviews.`);
    }

    // 10. Comments
    console.log("Migrating Comments...");
    const comments = await oldDb.select().from(schema.comment);
    if (comments.length > 0) {
      await newDb.insert(schema.comment).values(comments).onConflictDoNothing();
      console.log(`Migrated ${comments.length} comments.`);
    }

    // 11. Subscribers
    console.log("Migrating Subscribers...");
    const subscribers = await oldDb.select().from(schema.subscriber);
    if (subscribers.length > 0) {
      await newDb.insert(schema.subscriber).values(subscribers).onConflictDoNothing();
      console.log(`Migrated ${subscribers.length} subscribers.`);
    }

    console.log("Data migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the old database connection
    await oldClient.end();
  }
}

migrateData();
