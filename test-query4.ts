import { db } from "./lib/db";

async function main() {
  const authors = await db.query.author.findMany({
    with: { user: true }
  });
  console.log("Authors:", JSON.stringify(authors, null, 2));
}
main().catch(console.error);
