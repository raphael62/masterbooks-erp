/**
 * Clear all dummy/seed data from the database.
 * Uses Supabase service role (bypasses RLS).
 * Run: node scripts/clear-dummy-data.js
 *
 * Ensure .env has:
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Tables in FK-safe order (children first). All have id or a UUID column for the delete filter.
const TABLES = [
  'returnable_transactions',
  'stock_movements',
  'sales_invoice_items',
  'purchase_invoice_items',
  'supplier_payment_allocations',
  'supplier_ledger',
  'goods_receipt_items',
  'purchase_order_items',
  'empties_receive_items',
  'empties_dispatch_items',
  'empties_open_market_items',
  'price_list_items',
  'material_issue_items',
  'bom_items',
  'production_order_items',
  'sales_invoices',
  'purchase_invoices',
  'supplier_payments',
  'sales_order_items',
  'sales_orders',
  'goods_receipts',
  'purchase_orders',
  'empties_receive_header',
  'empties_dispatch_header',
  'empties_open_market_header',
  'promotion_rules',
  'promotions',
  'price_list_headers',
  'price_lists',
  'stock_levels_by_location',
  'material_issues',
  'bom_headers',
  'production_orders',
  'returnable_items',
  'audit_logs',
  'products',
  'customers',
  'vendors',
  'suppliers',
  'business_executives',
  'user_preferences',
  'task_authorizations',
  'vsr_monthly_targets',
  'ssr_monthly_targets',
  'notification_settings',
  'role_permissions',
  'roles',
  'tax_rates',
  'payment_accounts',
  'chart_of_accounts',
  'product_categories',
  'units_of_measure',
  'empties_types',
  'location_types',
  'customer_groups',
  'customer_types',
  'price_types',
  'locations',
  'companies',
];

async function main() {
  console.log('Clearing dummy data...\n');
  let cleared = 0;
  let skipped = 0;
  let failed = 0;

  for (const table of TABLES) {
    try {
      const { error } = await supabase.from(table).delete().gte('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          skipped++;
          continue;
        }
        console.error(`  ✗ ${table}: ${error.message}`);
        failed++;
        continue;
      }
      cleared++;
      console.log(`  ✓ ${table}`);
    } catch (e) {
      console.error(`  ✗ ${table}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Cleared: ${cleared}, Skipped (table not found): ${skipped}, Failed: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
