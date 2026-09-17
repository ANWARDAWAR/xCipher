const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.xkzcepwwtyypujrkaych:anwardawar231@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  connectionTimeoutMillis: 5000
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
