const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Docker: postgres service, host dev: localhost
  host: process.env.NODE_ENV === 'production' ? 'postgres' : 'localhost',
  port: process.env.NODE_ENV === 'production' ? 5432 : 5433
});

pool.on('error', (err) => console.error('DB pool error:', err));

// Fixed seed: Use client.query in connect callback
pool.on('connect', async (client) => {
  console.log('✅ DB connected');
  const testMerchant = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Merchant',
    email: 'test@example.com',
    apikey: 'keytestabc123',
    apisecret: 'secrettestxyz789'
  };
  try {
    const res = await client.query('SELECT id FROM merchants WHERE email = $1', [testMerchant.email]);
    if (res.rows.length === 0) {
      await client.query(`
        INSERT INTO merchants (id, name, email, apikey, apisecret, createdat, updatedat) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [testMerchant.id, testMerchant.name, testMerchant.email, testMerchant.apikey, testMerchant.apisecret]);
      console.log('✅ Test merchant seeded');
    } else {
      console.log('ℹ️ Test merchant exists');
    }
  } catch (err) {
    console.error('❌ Seed error (table missing?):', err.message);
  }
});

module.exports = pool;  // ✅ Direct export (no { pool })
