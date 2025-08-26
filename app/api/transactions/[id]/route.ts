import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { transactionPatchSchema } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServerClient();
  let body: z.infer<typeof transactionPatchSchema>;
  try {
    body = transactionPatchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
    const { data: existing, error: exErr } = await supabase
      .from('transactions')
      .select(
        'type, amount, account_id, from_account_id, to_account_id, category_id',
      )
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    if (exErr || !existing) {
      return NextResponse.json(
        { error: exErr?.message || 'Not found' },
        { status: 404 },
      );
    }

    const newType = body.type ?? existing.type;
    const newAmount = body.amount ?? existing.amount;
    const newAccountId = body.accountId ?? existing.account_id;
    const newFrom = body.fromAccountId ?? existing.from_account_id;
    const newTo = body.toAccountId ?? existing.to_account_id;
    const newCategoryId =
      body.categoryId === undefined ? existing.category_id : body.categoryId;

    if (newType === 'expense' || newType === 'income') {
      if (!newAccountId) {
        return NextResponse.json(
          { error: 'accountId is required' },
          { status: 400 },
        );
      }
    } else if (newType === 'transfer') {
      if (!newFrom || !newTo) {
        return NextResponse.json(
          { error: 'fromAccountId and toAccountId are required' },
          { status: 400 },
        );
      }
      if (newFrom === newTo) {
        return NextResponse.json(
          { error: 'fromAccountId and toAccountId must differ' },
          { status: 400 },
        );
      }
      if (newCategoryId !== null && newCategoryId !== undefined) {
        return NextResponse.json(
          { error: 'categoryId must be null for transfers' },
          { status: 400 },
        );
      }
      if (process.env.DISALLOW_NEGATIVE_BALANCE === 'true') {
        const { data: bal, error: balErr } = await supabase
          .from('accounts')
          .select('current_balance')
          .eq('user_id', user.id)
          .eq('id', newFrom)
          .single();
        if (balErr) {
          return NextResponse.json({ error: balErr.message }, { status: 400 });
        }
        let balance = bal?.current_balance ?? 0;
        if (existing.type === 'transfer' && existing.from_account_id === newFrom) {
          balance += existing.amount;
        }
        if (existing.type === 'expense' && existing.account_id === newFrom) {
          balance += existing.amount;
        }
        if (balance - newAmount < 0) {
          return NextResponse.json(
            { error: 'Insufficient funds' },
            { status: 400 },
          );
        }
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: body.actualDate,
        actual_date: body.actualDate,
        budget_month: body.budgetMonth,
        type: newType,
        account_id: newAccountId,
        from_account_id: newFrom,
        to_account_id: newTo,
        amount: newAmount,
        category_id: newCategoryId,
        note: body.note,
        tags: body.tags,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select(
        `*,
        account:accounts!transactions_account_id_fkey(name, type),
        from_account:accounts!transactions_from_account_id_fkey(name, type),
        to_account:accounts!transactions_to_account_id_fkey(name, type),
        category:categories(name, color, icon)`
      )
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
