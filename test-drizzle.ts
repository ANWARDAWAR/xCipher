import { sum } from "drizzle-orm";
import { pgTable, integer } from "drizzle-orm/pg-core";
const t = pgTable('t', { views: integer('views') });
try {
  console.log(typeof sum(t.views).mapWith);
} catch (e) {
  console.error("Error:", e.message);
}
