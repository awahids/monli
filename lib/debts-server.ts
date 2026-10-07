import type { createClient } from '@/lib/supabase/server';

/** Entries move balances through RLS, so the account must be the space's own. */
export async function ownsAccount(supabase: ReturnType<typeof createClient>, ownerId: string, accountId: string) {
  const { data } = await supabase.from('accounts').select('id').eq('id', accountId).eq('user_id', ownerId).maybeSingle();
  return !!data;
}
