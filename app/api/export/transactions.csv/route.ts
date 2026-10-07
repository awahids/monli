import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import type { Database } from '@/types/database';
import { selectAll } from '@/lib/select-all';

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['expense', 'income', 'transfer']).optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

function escapeCSV(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

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
    const { from, to, type, accountId, categoryId } = parse.data;
    type TxRow = Database['saku']['Tables']['transactions']['Row'] & {
      account: Pick<Database['saku']['Tables']['accounts']['Row'], 'name'> | null;
      from_account: Pick<Database['saku']['Tables']['accounts']['Row'], 'name'> | null;
      to_account: Pick<Database['saku']['Tables']['accounts']['Row'], 'name'> | null;
      category: Pick<Database['saku']['Tables']['categories']['Row'], 'name'> | null;
    };
    // Every row: a single request stops at 1000.
    const { data, error } = await selectAll((start, end) => {
      let query = supabase
        .from('transactions')
        .select(
          `actual_date, type, amount, note, tags,
          account:accounts!transactions_account_id_fkey(name),
          from_account:accounts!transactions_from_account_id_fkey(name),
          to_account:accounts!transactions_to_account_id_fkey(name),
          category:categories(name)`
        )
        .eq('user_id', space.ownerId)
        .order('actual_date', { ascending: true });

      if (from) {
        query = query.gte('actual_date', from);
      }
      if (to) {
        query = query.lte('actual_date', to);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (accountId) {
        query = query.or(
          `account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`
        );
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      return query.order('created_at').order('id').range(start, end).returns<TxRow[]>();
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const header = [
      'date',
      'type',
      'account',
      'fromAccount',
      'toAccount',
      'category',
      'amount',
      'note',
      'tags',
    ];
    const lines = [header.join(',')];
    data?.forEach(tx => {
      const note = (tx.note ?? '').replace(/\r?\n/g, ' ');
      const tags = (tx.tags ?? []).join('|');
      const row = [
        tx.actual_date,
        tx.type,
        tx.account?.name ?? '',
        tx.from_account?.name ?? '',
        tx.to_account?.name ?? '',
        tx.category?.name ?? '',
        tx.amount.toString(),
        note,
        tags,
      ].map(escapeCSV);
      lines.push(row.join(','));
    });
    const csv = lines.join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

