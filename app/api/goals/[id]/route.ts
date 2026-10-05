import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { savingsGoalPatchSchema } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  let body: z.infer<typeof savingsGoalPatchSchema>;
  try {
    body = savingsGoalPatchSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.targetAmount !== undefined) updates.target_amount = body.targetAmount;
  if (body.savedAmount !== undefined) updates.saved_amount = body.savedAmount;
  if (body.targetDate !== undefined) updates.target_date = body.targetDate;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.color !== undefined) updates.color = body.color;
  if (body.archived !== undefined) updates.archived = body.archived;
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('*')
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  try {
    const user = await getUser();
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
