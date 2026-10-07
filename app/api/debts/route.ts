import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { debtSchema } from '@/lib/validation';
import { ownsAccount } from '@/lib/debts-server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  try {
    const space = await getSpace();
    const { data, error } = await supabase
      .from('debts')
      .select('*, entries:debt_entries(id, kind, amount, account_id, date)')
      .eq('user_id', space.ownerId)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof debtSchema>;
  try {
    body = debtSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    if (body.accountId && !(await ownsAccount(supabase, space.ownerId, body.accountId))) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('debts')
      .insert({
        user_id: space.ownerId,
        kind: body.kind,
        person: body.person,
        amount: body.amount,
        due_date: body.dueDate ?? null,
        note: body.note || null,
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // The money borrowed or lent; the trigger moves the account balance.
    if (body.accountId) {
      const { error: entryError } = await supabase.from('debt_entries').insert({
        debt_id: data.id,
        user_id: space.ownerId,
        kind: 'principal',
        amount: body.amount,
        account_id: body.accountId,
        ...(body.date && { date: body.date }),
      });
      if (entryError) {
        await supabase.from('debts').delete().eq('id', data.id);
        return NextResponse.json({ error: entryError.message }, { status: 400 });
      }
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
