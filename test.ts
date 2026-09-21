import { db } from "./lib/db";
async function test() {
  await db.article.findUnique({ where: { id: "1" }, include: { category: { include: { parent: true } } } });
}
