import { db } from "../lib/db";
import { isNull, isNotNull } from "drizzle-orm";
import { article as articleTable } from "../lib/db/schema";

async function main() {
  console.log("Fixing featured flags...");

  const falseResult = await db.update(articleTable)
    .set({ featured: false })
    .where(isNull(articleTable.homepagePlacement))
    .returning({ id: articleTable.id });
  console.log(`Updated ${falseResult.length} articles to featured = false`);

  const trueResult = await db.update(articleTable)
    .set({ featured: true })
    .where(isNotNull(articleTable.homepagePlacement))
    .returning({ id: articleTable.id });
  console.log(`Updated ${trueResult.length} articles to featured = true`);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
