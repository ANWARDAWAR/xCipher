import { db } from "./lib/db";

async function main() {
  const authors = await db.query.author.findMany({
    with: {
      user: true,
    },
    limit: 1,
  });
  console.log(JSON.stringify(authors, null, 2));
}
main().catch(console.error);
