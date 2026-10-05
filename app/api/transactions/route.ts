import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { transactionCreateSchema } from '@/lib/validation';
import { z } from 'zod';

const dateOrMonth = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Invalid date');
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  from: dateOrMonth.optional(),
  to: dateOrMonth.optional(),
  dateField: z.enum(['actual', 'budget']).optional(),
  type: z.enum(['expense', 'income', 'transfer']).optional(),
  // UUIDs only: these values are interpolated into a PostgREST or() filter.
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.string().max(200).optional(),
  search: z.string().max(100).optional(),
});

/** Drops characters that have meaning in PostgREST filter syntax. */
function sanitizeSearch(value?: string): string {
  return (value ?? '').replace(/[,()"\\{}*%:]/g, ' ').trim();
}

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') ?? '20', 10) || 20, 1),
      100
    );
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    const parsedQuery = listQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? 'invalid query' },
        { status: 400 }
      );
    }
    const { from, to, type, accountId, categoryId, tags } = parsedQuery.data;
    const dateField = parsedQuery.data.dateField === 'budget' ? 'budget_month' : 'actual_date';
    const search = sanitizeSearch(parsedQuery.data.search);

    // Same filters for the page of rows and for the totals below.
    // Typed loosely: Supabase's builder generics are too deep to thread
    // through a shared helper (TS2589); results are typed at each call.
    const applyFilters = (q: any): any => {
      let out = q.eq('user_id', user.id);
      if (from) out = out.gte(dateField, from);
      if (to) out = out.lte(dateField, to);
      if (type) out = out.eq('type', type);
      if (categoryId) out = out.eq('category_id', categoryId);
      if (accountId)
        out = out.or(
          `account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`
        );
      if (tags) {
        const arr = tags.split(',').filter(Boolean);
        if (arr.length) out = out.contains('tags', arr);
      }
      if (search) out = out.or(`note.ilike.%${search}%,tags.cs.{"${search}"}`);
      return out;
    };

    const query = applyFilters(
      supabase.from('transactions').select(
        `*,
        account:accounts!transactions_account_id_fkey(name, type),
        from_account:accounts!transactions_from_account_id_fkey(name, type),
        to_account:accounts!transactions_to_account_id_fkey(name, type),
        category:categories(name, color, icon)`,
        { count: 'exact' }
      )
    );

    // Income/expense totals for the whole filtered set (first page only).
    // PostgREST caps each response at 1000 rows, so read in chunks.
    let summary: { income: number; expense: number } | undefined;
    if (page === 1 && searchParams.get('summary') === '1') {
      summary = { income: 0, expense: 0 };
      const CHUNK = 1000;
      for (let offset = 0; offset < 50 * CHUNK; offset += CHUNK) {
        const { data: chunk, error: sumErr } = (await applyFilters(
          supabase.from('transactions').select('type, amount')
        ).range(offset, offset + CHUNK - 1)) as {
          data: { type: string; amount: number }[] | null;
          error: { message: string } | null;
        };
        if (sumErr) {
          return NextResponse.json({ error: sumErr.message }, { status: 400 });
        }
        for (const t of chunk ?? []) {
          if (t.type === 'income') summary.income += t.amount;
          else if (t.type === 'expense') summary.expense += t.amount;
        }
        if (!chunk || chunk.length < CHUNK) break;
      }
    }

    const { data, error, count } = await query
      .order(dateField, { ascending: false })
      .order('created_at', { ascending: false })
      .range(fromIdx, toIdx);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      rows: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      summary,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  let body: z.infer<typeof transactionCreateSchema>;
  try {
    body = transactionCreateSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
    if (
      process.env.DISALLOW_NEGATIVE_BALANCE === 'true' &&
      body.type === 'transfer' &&
      body.fromAccountId
    ) {
      const { data: bal, error: balErr } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id)
        .eq('id', body.fromAccountId)
        .single();
      if (balErr) {
        return NextResponse.json({ error: balErr.message }, { status: 400 });
      }
      if ((bal?.current_balance ?? 0) - body.amount < 0) {
        return NextResponse.json(
          { error: 'Insufficient funds' },
          { status: 400 }
        );
      }
    }
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date: body.actualDate,
        actual_date: body.actualDate,
        budget_month: body.budgetMonth,
        type: body.type,
        account_id: body.type === 'transfer' ? null : body.accountId,
        from_account_id: body.type === 'transfer' ? body.fromAccountId : null,
        to_account_id: body.type === 'transfer' ? body.toAccountId : null,
        amount: body.amount,
        category_id: body.type === 'transfer' ? null : body.categoryId,
        note: body.note,
        tags: body.tags,
      })
      .select(
        `*,
        account:accounts!transactions_account_id_fkey(name, type),
        from_account:accounts!transactions_from_account_id_fkey(name, type),
        to_account:accounts!transactions_to_account_id_fkey(name, type),
        category:categories(name, color, icon)`
      )
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
