import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import type { Database } from '@/types/database';

export const revalidate = 60;

const querySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid month format. Use YYYY-MM'),
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
    const { month } = parse.data;

    type BudgetItem = Database['saku']['Tables']['budget_items']['Row'] & {
      category: Pick<
        Database['saku']['Tables']['categories']['Row'],
        'name' | 'color'
      > | null;
    };
    type Budget = { id: string; items: BudgetItem[] };
    const { data: budgetData, error: budgetErr } = await supabase
      .from('budgets')
      .select(
        'id, items:budget_items(amount, category_id, category:categories(name, color))'
      )
      .eq('user_id', space.ownerId)
      .eq('month', month)
      .maybeSingle<Budget>();
    if (budgetErr) {
      return NextResponse.json({ error: budgetErr.message }, { status: 400 });
    }

    const perCategory = new Map<
      string,
      { categoryId: string; name: string; color: string; planned: number; actual: number }
    >();
    budgetData?.items?.forEach(item => {
      perCategory.set(item.category_id, {
        categoryId: item.category_id,
        name: item.category?.name ?? '',
        color: item.category?.color ?? '#6B7280',
        planned: item.amount,
        actual: 0,
      });
    });

    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('amount, category_id, category:categories(name, color)')
      .eq('user_id', space.ownerId)
      .eq('type', 'expense')
      // Budget reports attribute spending by budget_month, not actual date.
      .eq('budget_month', month)
      .returns<{ amount: number; category_id: string | null; category: { name: string; color: string | null } | null }[]>();
    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 400 });
    }

    let totalActual = 0;
    txs?.forEach(tx => {
      // Uncategorized spending still counts towards the month total.
      totalActual += tx.amount;
      if (tx.category_id) {
        const entry = perCategory.get(tx.category_id);
        if (entry) entry.actual += tx.amount;
        else
          perCategory.set(tx.category_id, {
            categoryId: tx.category_id,
            name: tx.category?.name ?? '',
            color: tx.category?.color ?? '#6B7280',
            planned: 0,
            actual: tx.amount,
          });
      }
    });

    const data = Array.from(perCategory.values());
    const totalPlanned = data.reduce((sum, c) => sum + c.planned, 0);

    return NextResponse.json({ data, totalPlanned, totalActual });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

