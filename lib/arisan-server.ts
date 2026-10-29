import type { createClient } from '@/lib/supabase/server';
import { keysToCamel } from '@/lib/case';
import type { Arisan } from '@/lib/arisan';

type Client = ReturnType<typeof createClient>;

const SELECT =
  'id, name, amount, frequency, start_date, note, members:arisan_members(id, name, turn, is_me), payments:arisan_payments(member_id, round, paid_on)';

/** The owner's arisans with members (in turn order) and payments; one when `id` is given. */
export async function loadArisans(supabase: Client, ownerId: string, id?: string) {
  let query = supabase.from('arisans').select(SELECT).eq('user_id', ownerId);
  if (id) query = query.eq('id', id);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return { data: null, error };
  const arisans = keysToCamel<Arisan[]>(data ?? []).map((a) => ({
    ...a,
    amount: Number(a.amount),
    members: [...a.members].sort((x, y) => x.turn - y.turn),
  }));
  return { data: arisans, error: null };
}
