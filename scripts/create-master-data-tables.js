/**
 * Creates location_types, customer_groups, and customer_types tables.
 * Run: node scripts/create-master-data-tables.js
 *
 * Requires DATABASE_URL in .env (get from Supabase Dashboard → Project Settings → Database → Connection string URI)
 */

require('dotenv').config();
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const sqlPath = path.join(__dirname, 'create-master-data-tables.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL in .env');
    console.error('');
    console.error('Option A: Add DATABASE_URL to .env (from Supabase Dashboard → Project Settings → Database → Connection string URI)');
    console.error('Option B: Run the SQL manually in Supabase Dashboard → SQL Editor');
    console.error('         Copy contents of: scripts/create-master-data-tables.sql');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Created location_types, customer_groups, customer_types tables with seed data.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
