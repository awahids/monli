import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { savingsContributionSchema } from '@/lib/validation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/** Adds (positive) or withdraws (negative) an amount; the balance never goes below 0. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  let body: z.infer<typeof savingsContributionSchema>;
  try {
    body = savingsContributionSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    await getUser();
    const { data, error } = await supabase
      .rpc('contribute_savings_goal', { goal_id: params.id, delta: body.amount })
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
