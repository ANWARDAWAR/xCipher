import { db } from "./lib/db";
import { author as authorTable, user as userTable } from "./lib/db/schema.js";
import { eq, and } from "drizzle-orm";

async function main() {
  const result = await db.select()
    .from(authorTable)
    .leftJoin(userTable, eq(authorTable.id, userTable.authorId))
    .limit(1);
  console.log("Keys:", Object.keys(result[0] || {}));
}
main().catch(console.error);
