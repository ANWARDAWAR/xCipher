import { db } from "./lib/db";

async function main() {
  const users = await db.query.user.findMany({
    with: { authorProfile: true }
  });
  console.log("Users:", JSON.stringify(users, null, 2));
}
main().catch(console.error);
