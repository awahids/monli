import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { transactionCreateSchema } from '@/lib/validation';
import { z } from 'zod';

export async function GET(req: Request) {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
      .from('transactions')
      .select(
        `*,
        account:accounts!transactions_account_id_fkey(name, type),
        from_account:accounts!transactions_from_account_id_fkey(name, type),
        to_account:accounts!transactions_to_account_id_fkey(name, type),
        category:categories(name, color, icon)`,
        { count: 'exact' }
      )
      .eq('user_id', user.id);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const dateField = searchParams.get('dateField') === 'budget' ? 'budget_month' : 'actual_date';
    const type = searchParams.get('type');
    const accountId = searchParams.get('accountId');
    const categoryId = searchParams.get('categoryId');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');

    if (from) query = query.gte(dateField, from);
    if (to) query = query.lte(dateField, to);
    if (type) query = query.eq('type', type);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (accountId)
      query = query.or(
        `account_id.eq.${accountId},from_account_id.eq.${accountId},to_account_id.eq.${accountId}`
      );
    if (tags) {
      const arr = tags.split(',').filter(Boolean);
      if (arr.length) query = query.contains('tags', arr);
    }
    if (search) {
      query = query.or(
        `note.ilike.%${search}%,tags.cs.{${search}}`
      );
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
        account_id: body.accountId,
        from_account_id: body.fromAccountId,
        to_account_id: body.toAccountId,
        amount: body.amount,
        category_id: body.categoryId,
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
