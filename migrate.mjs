import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// connect with prepare: false which is required for Supabase pooled connections
const sql = postgres(connectionString, { prepare: false });

async function migrate() {
  try {
    console.log("Adding contentUrl to Article table...");
    await sql`ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "contentUrl" text`;
    
    console.log("Adding contentUrl to ArticleRevision table...");
    await sql`ALTER TABLE "ArticleRevision" ADD COLUMN IF NOT EXISTS "contentUrl" text`;
    
    console.log("Removing contentHtml and contentJson from Article table...");
    await sql`ALTER TABLE "Article" DROP COLUMN IF EXISTS "contentHtml"`;
    await sql`ALTER TABLE "Article" DROP COLUMN IF EXISTS "contentJson"`;
    
    console.log("Removing contentHtml and contentJson from ArticleRevision table...");
    await sql`ALTER TABLE "ArticleRevision" DROP COLUMN IF EXISTS "contentHtml"`;
    await sql`ALTER TABLE "ArticleRevision" DROP COLUMN IF EXISTS "contentJson"`;
    
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

migrate();
