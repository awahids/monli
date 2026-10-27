import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { selectAll } from '@/lib/select-all';
import { shiftMonth } from '@/lib/date';
import { keysToCamel } from '@/lib/case';
import { buildMonthlyReport, type ReportTx } from '@/lib/monthly-report';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Use YYYY-MM'),
});

/** The monthly report (lib/monthly-report.ts) of a budget month, by budget_month. */
export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const parse = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0]?.message ?? 'invalid query' }, { status: 400 });
    }
    const { month } = parse.data;
    const previousMonth = shiftMonth(month, -1);

    const fetchMonth = (m: string) =>
      selectAll((from, to) =>
        supabase
          .from('transactions')
          .select('type, amount, budget_month, category_id, note, actual_date, category:categories(name, color)')
          .eq('user_id', space.ownerId)
          .eq('budget_month', m)
          .order('id')
          .range(from, to)
      );
    const [now, before, budget] = await Promise.all([
      fetchMonth(month),
      fetchMonth(previousMonth),
      supabase
        .from('budgets')
        .select('items:budget_items(amount, category_id, category:categories(name))')
        .eq('user_id', space.ownerId)
        .eq('month', month)
        .maybeSingle<{ items: { amount: number; category_id: string; category: { name: string } | null }[] }>(),
    ]);
    const error = now.error ?? before.error ?? budget.error;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const report = buildMonthlyReport(
      month,
      previousMonth,
      keysToCamel<ReportTx[]>(now.data ?? []),
      keysToCamel<ReportTx[]>(before.data ?? []),
      (budget.data?.items ?? []).map((i) => ({ categoryId: i.category_id, amount: i.amount, name: i.category?.name ?? '' }))
    );
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
