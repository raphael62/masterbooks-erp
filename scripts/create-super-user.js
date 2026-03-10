/**
 * Create a Super User in Supabase.
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * Usage: node scripts/create-super-user.js [email] [password] [fullName]
 * Example: node scripts/create-super-user.js admin@masterbooks.gh SuperSecure123!
 *
 * Get service_role key: Supabase Dashboard → Settings → API → service_role (secret)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2] || 'admin@masterbooks.gh';
const password = process.argv[3] || 'Admin123!';
const fullName = process.argv[4] || 'Super Admin';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Add: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log('Creating Super User...');
  console.log('Email:', email);

  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error) {
    if (error.message?.includes('already been registered')) {
      console.log('User already exists. Updating profile...');
      const { data: existing } = await supabase.auth.admin.listUsers();
      const existingUser = existing?.users?.find((u) => u.email === email);
      if (existingUser) {
        await supabase.from('user_profiles').upsert({
          id: existingUser.id,
          full_name: fullName,
          role: 'Admin',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        console.log('Profile updated. Super User ready:', email);
        return;
      }
    }
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (user?.user) {
    await supabase.from('user_profiles').upsert({
      id: user.user.id,
      full_name: fullName,
      role: 'Admin',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    console.log('Super User created successfully:', email);
  }
}

main();
