import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { selectAll } from '@/lib/select-all';

export const revalidate = 60;

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getUTCFullYear();
    if (isNaN(year)) {
      return NextResponse.json({ error: 'invalid year' }, { status: 400 });
    }


    const { data, error } = await selectAll((from, to) =>
      supabase
        .from('transactions')
        .select('budget_month, type, amount')
        .eq('user_id', space.ownerId)
        // By budget period, like Beranda and Budget (a pay-day period can start in the previous month).
        .gte('budget_month', `${year}-01`)
        .lte('budget_month', `${year}-12`)
        .order('id')
        .range(from, to)
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `${year}-${String(i + 1).padStart(2, '0')}`,
      income: 0,
      expense: 0,
    }));

    data?.forEach(tx => {
      const idx = Number(tx.budget_month.slice(5, 7)) - 1;
      if (tx.type === 'income') {
        months[idx].income += tx.amount;
      } else if (tx.type === 'expense') {
        months[idx].expense += tx.amount;
      }
    });

    return NextResponse.json({ data: months });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
