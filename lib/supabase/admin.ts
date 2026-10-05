
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { DB_SCHEMA } from './schema';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    db: { schema: DB_SCHEMA },
  });
}
