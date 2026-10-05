import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type ProfileRow = Database['saku']['Tables']['profiles']['Row'];

/** Display name from the auth user: Google's full name, the sign-up name, or the email's local part. */
export function displayName(user: Pick<User, 'email' | 'user_metadata'>): string {
  const meta = user.user_metadata ?? {};
  const name = (meta.full_name || meta.name || '').toString().trim();
  return name || (user.email ?? 'Pengguna').split('@')[0];
}

/**
 * Returns the user's Qala Saku profile, creating it on first visit.
 *
 * The Supabase project is shared with other apps, so an account can exist
 * (from Google sign-in or another app) without a profile in the "saku"
 * schema. Runs with the user's own session: RLS allows inserting one's own
 * row and a trigger forces plan = FREE.
 */
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: Pick<User, 'id' | 'email' | 'user_metadata'>,
): Promise<ProfileRow | null> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return existing;
  if (!user.email) return null;

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email, name: displayName(user), default_currency: 'IDR' })
    .select('*')
    .single();
  if (error) {
    // Another tab may have created it in the meantime.
    const { data: retry } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    return retry ?? null;
  }
  return created;
}
