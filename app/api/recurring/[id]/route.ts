import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { recurringSchema } from '@/lib/validation';
import { firstOccurrence } from '@/lib/recurring';
import { formatDate } from '@/lib/date';
import { RECURRING_SELECT, toRecurringRow } from '@/lib/recurring-db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const toggleSchema = z.object({ active: z.boolean() });

/**
 * PATCH { active } pauses or resumes a rule; any other body replaces the rule.
 * Both restart the schedule from today, so a pause or an edit never
 * backfills occurrences that were skipped.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const raw = await req.json().catch(() => null);
  const today = formatDate(new Date());
  let updates: Record<string, unknown>;

  const toggle = toggleSchema.strict().safeParse(raw);
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    if (toggle.success) {
      const { data: rule } = await supabase
        .from('recurring_transactions')
        .select('frequency, day_of_month, start_date, end_date')
        .eq('id', params.id)
        .eq('user_id', space.ownerId)
        .single();
      if (!rule) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
      updates = { active: toggle.data.active };
      if (toggle.data.active) {
        const from = rule.start_date > today ? rule.start_date : today;
        updates.next_date = firstOccurrence(from, rule.frequency, rule.day_of_month);
      }
    } else {
      const parsed = recurringSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' },
          { status: 400 },
        );
      }
      const body = parsed.data;
      const from = body.startDate > today ? body.startDate : today;
      updates = {
        ...toRecurringRow(body),
        next_date: firstOccurrence(from, body.frequency, body.dayOfMonth),
        active: true,
      };
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', space.ownerId)
      .select(RECURRING_SELECT)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/** Deletes the rule. Transactions it already created stay (recurring_id → null). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
