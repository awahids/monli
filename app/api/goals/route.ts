import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { savingsGoalSchema } from '@/lib/validation';
import { FREE_LIMITS } from '@/lib/plans';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('archived', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof savingsGoalSchema>;
  try {
    body = savingsGoalSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const user = await getUser();
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
    if (profile?.plan !== 'PRO') {
      const { count } = await supabase
        .from('savings_goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('archived', false);
      if ((count ?? 0) >= FREE_LIMITS.goals) {
        return NextResponse.json(
          { error: `Paket FREE dibatasi ${FREE_LIMITS.goals} target tabungan aktif` },
          { status: 403 },
        );
      }
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        name: body.name,
        target_amount: body.targetAmount,
        saved_amount: body.savedAmount ?? 0,
        target_date: body.targetDate ?? null,
        icon: body.icon ?? null,
        color: body.color ?? null,
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
