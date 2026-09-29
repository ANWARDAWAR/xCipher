import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: "postgresql://postgres.xkzcepwwtyypujrkaych:%40junoonhurmaz231@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" });

async function run() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log("Success:", result.rows);
    client.release();
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
