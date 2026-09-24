import { db } from "./lib/db";

async function main() {
  const existingAuthor = await db.author.findFirst({
    where: { 
      name: "Test Name",
      user: null
    }
  });
  console.log("Syntax is valid", existingAuthor);
}
main().catch(console.error);
