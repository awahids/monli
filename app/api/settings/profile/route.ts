import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { profilePatchSchema } from '@/lib/validation';
import { rebucketTransactions } from '@/lib/budget-rebucket';
import { z } from 'zod';

const COLUMNS = 'id, email, name, default_currency, budget_start_day, created_at, updated_at';

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  default_currency: string;
  budget_start_day: number;
};

function toProfile(row: ProfileRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    defaultCurrency: row.default_currency,
    budgetStartDay: row.budget_start_day ?? 1,
  };
}

export async function GET() {
  const supabase = createServerClient();
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from('profiles')
      .select(COLUMNS)
      .eq('id', user.id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json(toProfile(data));
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
    const { data: before } = await supabase
      .from('profiles')
      .select('budget_start_day')
      .eq('id', user.id)
      .single();
    const update = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.defaultCurrency !== undefined ? { default_currency: body.defaultCurrency } : {}),
      ...(body.budgetStartDay !== undefined ? { budget_start_day: body.budgetStartDay } : {}),
    };
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select(COLUMNS)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    // Totals everywhere follow budget_month, so move transactions into the new periods.
    const moved = await rebucketTransactions(
      supabase,
      user.id,
      before?.budget_start_day ?? 1,
      data.budget_start_day ?? 1
    );
    return NextResponse.json({ ...toProfile(data), moved });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
