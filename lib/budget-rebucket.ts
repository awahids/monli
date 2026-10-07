import type { SupabaseClient } from '@supabase/supabase-js';
import { rebucket } from '@/lib/date';
import { selectAll } from '@/lib/select-all';

/**
 * After the period start day changes, moves the owner's transactions whose
 * budget month was set automatically into the period they now fall in.
 * Returns how many moved.
 */
export async function rebucketTransactions(
  // Typed loosely: the generated schema types are too deep to pass around (TS2589).
  supabase: SupabaseClient<any, any, any>,
  ownerId: string,
  oldStartDay: number,
  newStartDay: number
): Promise<number> {
  if (oldStartDay === newStartDay) return 0;
  const { data, error } = await selectAll<{ id: string; actual_date: string; budget_month: string }>((from, to) =>
    supabase
      .from('transactions')
      .select('id, actual_date, budget_month')
      .eq('user_id', ownerId)
      .order('id')
      .range(from, to)
  );
  if (error) throw new Error(error.message);

  const byMonth = new Map<string, string[]>();
  for (const move of rebucket(data ?? [], oldStartDay, newStartDay)) {
    byMonth.set(move.budget_month, [...(byMonth.get(move.budget_month) ?? []), move.id]);
  }
  let moved = 0;
  for (const [month, ids] of Array.from(byMonth)) {
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ budget_month: month })
        .eq('user_id', ownerId)
        .in('id', chunk);
      if (updateError) throw new Error(updateError.message);
      moved += chunk.length;
    }
  }
  return moved;
}
