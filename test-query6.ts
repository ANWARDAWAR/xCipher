import { db } from "./lib/db";
import { author as authorTable, user as userTable } from "./lib/db/schema.js";
import { eq, and } from "drizzle-orm";

async function main() {
  const q = db.select()
    .from(authorTable)
    .leftJoin(userTable, eq(authorTable.id, userTable.authorId))
    .where(eq(userTable.id, null as any))
    .toSQL();
  console.log(q.sql);
}
main().catch(console.error);
