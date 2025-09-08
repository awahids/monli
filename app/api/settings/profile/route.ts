import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { profilePatchSchema } from '@/lib/validation';
import { z } from 'zod';

export async function GET() {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, default_currency, budget_cutoff_day, created_at, updated_at')
      .eq('id', user.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  const supabase = createServerClient();
  let body: z.infer<typeof profilePatchSchema>;
  try {
    body = profilePatchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
  try {
    const user = await getUser();
    const update = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.defaultCurrency !== undefined
        ? { default_currency: body.defaultCurrency }
        : {}),
      ...(body.budgetCutoffDay !== undefined
        ? { budget_cutoff_day: body.budgetCutoffDay }
        : {}),
    };
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select('id, email, name, default_currency, budget_cutoff_day, created_at, updated_at')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
