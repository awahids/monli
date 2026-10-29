import type { createAdminClient } from '@/lib/supabase/admin';
import type { createClient } from '@/lib/supabase/server';
import { keysToCamel } from '@/lib/case';
import { selectAll } from '@/lib/select-all';
import { addDays, buildWeeklySummary, type WeeklySummary, type WeeklyTx } from '@/lib/weekly-summary';

type Client = ReturnType<typeof createClient> | ReturnType<typeof createAdminClient>;

/** The weekly summary of an owner's data, for the week starting `start` (a Monday). */
export async function loadWeeklySummary(
  supabase: Client,
  ownerId: string,
  start: string,
  today: string
): Promise<{ data: WeeklySummary | null; error: { message: string } | null }> {
  const { data, error } = await selectAll((from, to) =>
    (supabase as ReturnType<typeof createClient>)
      .from('transactions')
      .select('type, amount, actual_date, category_id, category:categories(name, color)')
      .eq('user_id', ownerId)
      .gte('actual_date', addDays(start, -7))
      .lte('actual_date', addDays(start, 6))
      .order('id')
      .range(from, to)
  );
  if (error) return { data: null, error };
  return { data: buildWeeklySummary(start, today, keysToCamel<WeeklyTx[]>(data ?? [])), error: null };
}
