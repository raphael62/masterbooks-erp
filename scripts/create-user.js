/**
 * Create regular users in Supabase (not Super/Admin).
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * Usage: node scripts/create-user.js [email1] [email2] ...
 * Default password: 123456789
 *
 * Example: node scripts/create-user.js user1@example.com user2@example.com
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_PASSWORD = '123456789';
const emails = process.argv.slice(2).filter(Boolean);

if (emails.length === 0) {
  console.error('Usage: node scripts/create-user.js <email1> [email2] ...');
  console.error('Example: node scripts/create-user.js user@example.com');
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function fullNameFromEmail(email) {
  const local = email.split('@')[0] || 'User';
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function createUser(email) {
  const fullName = fullNameFromEmail(email);
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error) {
    if (error.message?.includes('already been registered')) {
      console.log(`  ${email} – already exists, profile will sync via trigger`);
      return;
    }
    throw new Error(`${email}: ${error.message}`);
  }

  if (user?.user) {
    await supabase.from('user_profiles').upsert({
      id: user.user.id,
      full_name: fullName,
      email: email.trim(),
      role: 'User',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    console.log(`  ${email} – created (password: ${DEFAULT_PASSWORD})`);
  }
}

async function main() {
  console.log('Creating users (password: ' + DEFAULT_PASSWORD + ')...');
  for (const email of emails) {
    try {
      await createUser(email);
    } catch (err) {
      console.error(err.message);
    }
  }
  console.log('Done.');
}

main();
