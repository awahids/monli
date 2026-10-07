import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { nextMonthStart } from '@/lib/date';
import type { Database } from '@/types/database';
import { selectAll } from '@/lib/select-all';

export const revalidate = 60;

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const space = await getSpace();
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', space.ownerId)
      .single();
    if (profile?.plan !== 'PRO') {
      return NextResponse.json({ error: 'Upgrade to access category reports' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json({ error: 'month is required (YYYY-MM)' }, { status: 400 });
    }

    type TxRow = Database['saku']['Tables']['transactions']['Row'] & {
      category: Pick<Database['saku']['Tables']['categories']['Row'], 'name' | 'color'> | null;
    };
    const { data, error } = await selectAll((from, to) =>
      supabase
        .from('transactions')
        .select('amount, category_id, category:categories(name, color)')
        .eq('user_id', space.ownerId)
        .eq('type', 'expense')
        .gte('actual_date', `${month}-01`)
        .lt('actual_date', nextMonthStart(month))
        .order('id')
        .range(from, to)
        .returns<TxRow[]>()
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const map = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();
    data?.forEach(tx => {
      if (tx.category_id) {
        const key = tx.category_id;
        const existing = map.get(key);
        const name = tx.category?.name ?? '';
        const color = tx.category?.color ?? '#6B7280';
        if (existing) {
          existing.amount += tx.amount;
        } else {
          map.set(key, { categoryId: key, name, color, amount: tx.amount });
        }
      }
    });

    return NextResponse.json({ data: Array.from(map.values()) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
