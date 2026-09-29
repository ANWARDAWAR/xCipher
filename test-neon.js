import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://postgres.xkzcepwwtyypujrkaych:%40junoonhurmaz231@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres");

async function run() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log("Success:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
