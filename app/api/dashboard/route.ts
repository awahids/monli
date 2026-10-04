import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { currentMonth, formatDate, nextMonthStart } from '@/lib/date';
import type { Database } from '@/types/database';
import { ensureDefaultCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Use YYYY-MM'),
  accountId: z.string().uuid().optional(),
});

// Date rule: the timeline (daily chart, categories, MTD spend) uses
// actual_date; budget planned vs actual uses budget_month.
export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    await ensureDefaultCategories(supabase, user.id);
    const { searchParams } = new URL(req.url);
    const parse = querySchema.safeParse({
      month: searchParams.get('month') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { month, accountId } = parse.data;
    const start = `${month}-01`;
    const end = nextMonthStart(month);

    const { data: totalBalanceData, error: balanceErr } = await supabase.rpc(
      'get_total_balance',
      { account_id: accountId ?? null }
    );
    if (balanceErr) {
      return NextResponse.json({ error: balanceErr.message }, { status: 400 });
    }

    const withAccount = <Q extends { or: (filter: string) => Q }>(q: Q) =>
      accountId
        ? q.or(
            `account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`
          )
        : q;

    const { data: monthTxs, error: monthErr } = await withAccount(
      supabase
        .from('transactions')
        .select(
          `*,
          account:accounts!transactions_account_id_fkey(name, type),
          from_account:accounts!transactions_from_account_id_fkey(name, type),
          to_account:accounts!transactions_to_account_id_fkey(name, type),
          category:categories(name, color, icon)`
        )
        .eq('user_id', user.id)
        .gte('actual_date', start)
        .lt('actual_date', end)
        .order('actual_date', { ascending: false })
        .order('created_at', { ascending: false })
    );
    if (monthErr) {
      return NextResponse.json({ error: monthErr.message }, { status: 400 });
    }

    const { data: budgetTxs, error: budgetTxErr } = await withAccount(
      supabase
        .from('transactions')
        .select('amount, category_id, category:categories(name)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('budget_month', month)
    ).returns<{ amount: number; category_id: string | null; category: { name: string } | null }[]>();
    if (budgetTxErr) {
      return NextResponse.json({ error: budgetTxErr.message }, { status: 400 });
    }

    type BudgetItem = Database['public']['Tables']['budget_items']['Row'] & {
      category: Pick<Database['public']['Tables']['categories']['Row'], 'name'> | null;
    };
    type Budget = { id: string; items: BudgetItem[] };
    const { data: budgetData, error: budgetErr } = await supabase
      .from('budgets')
      .select('id, items:budget_items(amount, category_id, category:categories(name))')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle<Budget>();
    if (budgetErr) {
      return NextResponse.json({ error: budgetErr.message }, { status: 400 });
    }

    const totalBalance = totalBalanceData ?? 0;

    // Budget planned vs actual (budget_month)
    const perCategoryMap = new Map<string, { categoryId: string; categoryName: string; planned: number; actual: number }>();
    let totalPlanned = 0;
    (budgetData?.items ?? []).forEach(item => {
      totalPlanned += item.amount;
      perCategoryMap.set(item.category_id, {
        categoryId: item.category_id,
        categoryName: item.category?.name ?? '',
        planned: item.amount,
        actual: 0,
      });
    });
    let totalActual = 0;
    budgetTxs?.forEach(tx => {
      totalActual += tx.amount;
      if (!tx.category_id) return;
      const pc = perCategoryMap.get(tx.category_id);
      if (pc) pc.actual += tx.amount;
      else {
        perCategoryMap.set(tx.category_id, {
          categoryId: tx.category_id,
          categoryName: tx.category?.name ?? '',
          planned: 0,
          actual: tx.amount,
        });
      }
    });

    // Timeline (actual_date)
    const today = formatDate(new Date());
    let mtdSpend = 0;
    const dailyMap = new Map<string, number>();
    const categoryMap = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();
    monthTxs?.forEach(tx => {
      if (tx.type !== 'expense') return;
      if (tx.actual_date <= today) mtdSpend += tx.amount;
      dailyMap.set(tx.actual_date, (dailyMap.get(tx.actual_date) ?? 0) + tx.amount);
      if (tx.category_id) {
        const cat = categoryMap.get(tx.category_id);
        if (cat) cat.amount += tx.amount;
        else
          categoryMap.set(tx.category_id, {
            categoryId: tx.category_id,
            name: tx.category?.name ?? '',
            color: tx.category?.color ?? '',
            amount: tx.amount,
          });
      }
    });
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    const [y, m] = month.split('-').map(Number);
    const totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const thisMonth = currentMonth();
    const daysPassed =
      month < thisMonth ? totalDays : month > thisMonth ? 0 : Number(today.slice(8, 10));
    const dailyAverage = daysPassed > 0 ? mtdSpend / daysPassed : 0;
    const remainingDays = Math.max(totalDays - daysPassed, 0);
    const remainingDaysAllowance =
      remainingDays > 0 ? Math.max((totalPlanned - totalActual) / remainingDays, 0) : 0;

    return NextResponse.json({
      totalBalance,
      budget: {
        totalPlanned,
        totalActual,
        perCategory: Array.from(perCategoryMap.values()),
      },
      mtd: {
        spend: mtdSpend,
        dailyAverage,
        remainingDaysAllowance,
      },
      daily,
      categories: Array.from(categoryMap.values()),
      recentTransactions: monthTxs?.slice(0, 5) ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
