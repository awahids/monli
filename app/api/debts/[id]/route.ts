import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { debtUpdateSchema } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/** Deleting a debt reverses every balance change it made (see the migration). */
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { error } = await supabase.from('debts').delete().eq('id', params.id).eq('user_id', space.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/**
 * Fixes a debt's name, amount, dates or note. Its kind and account stay as
 * recorded. A new amount or date replaces the principal entry, so the
 * entry triggers move the account balance by the difference.
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  let body: z.infer<typeof debtUpdateSchema>;
  try {
    body = debtUpdateSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: debt } = await supabase
      .from('debts')
      .select('amount, paid, entries:debt_entries(id, kind, amount, account_id, date)')
      .eq('id', params.id)
      .eq('user_id', space.ownerId)
      .maybeSingle();
    if (!debt) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    if (body.amount < Number(debt.paid)) {
      return NextResponse.json({ error: 'Nominal lebih kecil dari yang sudah dibayar' }, { status: 400 });
    }

    const old = debt.entries?.find((e) => e.kind === 'principal');
    const date = body.date ?? old?.date;
    if (!old || Number(old.amount) !== body.amount || old.date !== date) {
      // Debts recorded before every debt kept a principal entry get one now.
      const { data: added, error } = await supabase.from('debt_entries').insert({
        debt_id: params.id,
        user_id: space.ownerId,
        kind: 'principal',
        amount: body.amount,
        account_id: old?.account_id ?? null,
        ...(date && { date }),
      }).select('id').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (old) {
        const { error: delError } = await supabase.from('debt_entries').delete().eq('id', old.id);
        if (delError) {
          // Keep exactly one principal, or the balance moves twice.
          await supabase.from('debt_entries').delete().eq('id', added.id);
          return NextResponse.json({ error: delError.message }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from('debts')
      .update({ person: body.person, amount: body.amount, due_date: body.dueDate ?? null, note: body.note || null })
      .eq('id', params.id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
