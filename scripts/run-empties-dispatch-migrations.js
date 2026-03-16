/**
 * Run Empties Dispatch migrations (credit_note, po_number, delivery_note)
 * Run: node scripts/run-empties-dispatch-migrations.js
 */

require('dotenv').config();
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const migrations = [
  '20260309200000_empties_dispatch_credit_note.sql',
  '20260309210000_empties_dispatch_po_delivery.sql',
  '20260309220000_supplier_ledger_empties_dispatch.sql',
];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    for (const name of migrations) {
      const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', name);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
      console.log('OK:', name);
    }
    console.log('Migrations completed.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
