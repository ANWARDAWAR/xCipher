import { db } from "../lib/db";

async function main() {
  console.log("Fixing featured flags...");

  const falseResult = await db.article.updateMany({
    where: { homepagePlacement: null },
    data: { featured: false },
  });
  console.log(`Updated ${falseResult.count} articles to featured = false`);

  const trueResult = await db.article.updateMany({
    where: { homepagePlacement: { not: null } },
    data: { featured: true },
  });
  console.log(`Updated ${trueResult.count} articles to featured = true`);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
