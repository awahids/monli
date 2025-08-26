import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function seed() {
  const email = 'awahid.safhadi@gmail.com';
  const password = 'Pass123*#!';
  const name = 'Awahid Safhadi';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    throw new Error('Failed to create user: ' + error.message);
  }

  const user = data.user;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    email,
    name,
    default_currency: 'IDR',
  });

  if (profileError) {
    throw new Error('Failed to create profile: ' + profileError.message);
  }

  const { error: accountError } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: 'Cash',
    type: 'cash',
    currency: 'IDR',
    opening_balance: 0,
    current_balance: 0,
  });

  if (accountError) {
    throw new Error('Failed to create account: ' + accountError.message);
  }

  console.log('Seeded profile and account for', email);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
