import { db } from "./lib/db";

async function main() {
  const query = db.query.author.findMany({
    with: {
      user: true,
    }
  }).toSQL();
  console.log(query.sql);
}
main().catch(console.error);
