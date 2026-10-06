import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { recurringSchema } from '@/lib/validation';
import { firstOccurrence } from '@/lib/recurring';
import { FREE_LIMITS } from '@/lib/plans';
import { RECURRING_SELECT, toRecurringRow } from '@/lib/recurring-db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  try {
    const space = await getSpace();
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select(RECURRING_SELECT)
      .eq('user_id', space.ownerId)
      .order('active', { ascending: false })
      .order('next_date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof recurringSchema>;
  try {
    body = recurringSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', space.ownerId).single();
    if (profile?.plan !== 'PRO') {
      const { count } = await supabase
        .from('recurring_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', space.ownerId);
      if ((count ?? 0) >= FREE_LIMITS.recurring) {
        return NextResponse.json(
          { error: `Paket FREE dibatasi ${FREE_LIMITS.recurring} transaksi rutin` },
          { status: 403 },
        );
      }
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: space.ownerId,
        ...toRecurringRow(body),
        // A start date in the past backfills the occurrences since then.
        next_date: firstOccurrence(body.startDate, body.frequency, body.dayOfMonth),
      })
      .select(RECURRING_SELECT)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
