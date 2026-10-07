import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { debtPaymentSchema } from '@/lib/validation';
import { ownsAccount } from '@/lib/debts-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  let body: z.infer<typeof debtPaymentSchema>;
  try {
    body = debtPaymentSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: debt } = await supabase
      .from('debts')
      .select('amount, paid')
      .eq('id', params.id)
      .eq('user_id', space.ownerId)
      .maybeSingle();
    if (!debt) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });
    const remaining = Number(debt.amount) - Number(debt.paid);
    if (body.amount > remaining) {
      return NextResponse.json({ error: 'Nominal melebihi sisa yang belum dibayar' }, { status: 400 });
    }
    if (body.accountId && !(await ownsAccount(supabase, space.ownerId, body.accountId))) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 400 });
    }
    const { error } = await supabase.from('debt_entries').insert({
      debt_id: params.id,
      user_id: space.ownerId,
      kind: 'payment',
      amount: body.amount,
      account_id: body.accountId ?? null,
      ...(body.date && { date: body.date }),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
