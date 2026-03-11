/**
 * Sync all auth.users into user_profiles so they appear on the Users page.
 * Use when users exist in Supabase Auth but don't show in the app.
 *
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 * Usage: node scripts/sync-user-profiles.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function fullNameFrom(user) {
  const meta = user?.user_metadata || {};
  const name = meta?.full_name || meta?.name;
  if (name) return name;
  const email = user?.email || '';
  const local = email.split('@')[0] || 'User';
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  console.log('Syncing auth users to user_profiles...');
  let page = 1;
  let total = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error listing users:', error.message);
      process.exit(1);
    }
    const users = data?.users || [];
    if (users.length === 0) break;

    for (const u of users) {
      const profile = {
        id: u.id,
        full_name: fullNameFrom(u),
        email: u.email || null,
        role: 'User',
        updated_at: new Date().toISOString(),
      };
      const { error: upsertErr } = await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });
      if (upsertErr) {
        console.error(`  ${u.email}: ${upsertErr.message}`);
      } else {
        console.log(`  ${u.email}`);
        total++;
      }
    }
    hasMore = users.length === 100;
    page++;
  }

  console.log(`Synced ${total} user(s) to user_profiles.`);
}

main();
