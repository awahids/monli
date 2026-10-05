import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import type { Database } from '@/types/database';

export const revalidate = 60;

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid from date format'),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid to date format'),
  accountId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const parse = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { from, to, accountId } = parse.data;

    type TxRow = Database['saku']['Tables']['transactions']['Row'] & {
      category: Pick<Database['saku']['Tables']['categories']['Row'], 'name' | 'color'> | null;
    };
    let query = supabase
      .from('transactions')
      .select('amount, category_id, category:categories(name, color)')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('actual_date', from)
      .lte('actual_date', to);
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    const { data, error } = await query.returns<TxRow[]>();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const map = new Map<string, { categoryId: string; name: string; color: string; amount: number }>();
    data?.forEach(tx => {
      if (tx.category_id) {
        const name = tx.category?.name ?? '';
        const color = tx.category?.color ?? '#6B7280';
        const existing = map.get(tx.category_id);
        if (existing) existing.amount += tx.amount;
        else map.set(tx.category_id, { categoryId: tx.category_id, name, color, amount: tx.amount });
      }
    });

    return NextResponse.json({ data: Array.from(map.values()) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

