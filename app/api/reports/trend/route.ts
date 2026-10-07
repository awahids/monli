import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { nextMonthStart } from '@/lib/date';
import { selectAll } from '@/lib/select-all';

export const revalidate = 60;

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid from month format'),
  to: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid to month format'),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const { searchParams } = new URL(req.url);
    const parse = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { from, to } = parse.data;
    const fromDate = new Date(`${from}-01T00:00:00.000Z`);
    const toDate = new Date(`${to}-01T00:00:00.000Z`);

    const months: string[] = [];
    let cur = new Date(fromDate);
    while (
      cur <= toDate && months.length < 12
    ) {
      months.push(
        `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, '0')}`
      );
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    }
    if (months.length === 0 || toDate < fromDate) {
      return NextResponse.json({ error: 'invalid range' }, { status: 400 });
    }
    if (
      toDate >= new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 12, 1))
    ) {
      return NextResponse.json({ error: 'range too large (max 12 months)' }, { status: 400 });
    }

    const { data, error } = await selectAll((start, end) =>
      supabase
        .from('transactions')
        .select('actual_date, type, amount')
        .eq('user_id', space.ownerId)
        .gte('actual_date', `${from}-01`)
        .lt('actual_date', nextMonthStart(to))
        .order('id')
        .range(start, end)
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = months.map(m => ({ month: m, income: 0, expense: 0 }));
    const index = new Map(result.map((r, i) => [r.month, i]));
    data?.forEach(tx => {
      const idx = index.get(tx.actual_date.slice(0, 7));
      if (idx !== undefined) {
        if (tx.type === 'income') result[idx].income += tx.amount;
        else if (tx.type === 'expense') result[idx].expense += tx.amount;
      }
    });

    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

