import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import type { Database } from '@/types/database';

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
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const parse = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { from, to, type, accountId, categoryId } = parse.data;
    type TxRow = Database['public']['Tables']['transactions']['Row'] & {
      account: Pick<Database['public']['Tables']['accounts']['Row'], 'name'> | null;
      from_account: Pick<Database['public']['Tables']['accounts']['Row'], 'name'> | null;
      to_account: Pick<Database['public']['Tables']['accounts']['Row'], 'name'> | null;
      category: Pick<Database['public']['Tables']['categories']['Row'], 'name'> | null;
    };
    let query = supabase
      .from('transactions')
      .select(
        `date, type, amount, note, tags,
        account:accounts!transactions_account_id_fkey(name),
        from_account:accounts!transactions_from_account_id_fkey(name),
        to_account:accounts!transactions_to_account_id_fkey(name),
        category:categories(name)`
      )
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (from) {
      const start = new Date(`${from}T00:00:00.000Z`);
      query = query.gte('date', start.toISOString());
    }
    if (to) {
      const endDay = new Date(`${to}T00:00:00.000Z`);
      const end = new Date(
        Date.UTC(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate() + 1)
      );
      query = query.lt('date', end.toISOString());
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

    const { data, error } = await query.returns<TxRow[]>();
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
        new Date(tx.date).toISOString(),
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

