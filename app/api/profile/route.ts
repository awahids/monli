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
        .select('id, email, name, default_currency, onboarding_completed, budget_cutoff_day')
        .eq('id', user.id)
        .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
      return NextResponse.json({
        id: data.id,
        email: data.email,
        name: data.name,
        defaultCurrency: data.default_currency,
        onboardingCompleted: data.onboarding_completed,
        budgetCutoffDay: data.budget_cutoff_day,
      });
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
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: body.name,
          default_currency: body.defaultCurrency,
          budget_cutoff_day: body.budgetCutoffDay,
        })
        .eq('id', user.id)
        .select('id, email, name, default_currency, onboarding_completed, budget_cutoff_day')
        .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
    }
      return NextResponse.json({
        id: data.id,
        email: data.email,
        name: data.name,
        defaultCurrency: data.default_currency,
        onboardingCompleted: data.onboarding_completed,
        budgetCutoffDay: data.budget_cutoff_day,
      });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
