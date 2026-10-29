import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSpace, readOnlyResponse } from '@/lib/auth/server';
import { formatDate } from '@/lib/date';
import { challengeSchema } from '@/lib/validation';
import { MAX_ACTIVE_CHALLENGES } from '@/lib/challenges';
import { loadChallenges } from '@/lib/challenges-server';

export const dynamic = 'force-dynamic';

/** The recording streak, the challenges with their progress, and Kanto's mood. */
export async function GET() {
  const supabase = createClient();
  try {
    const space = await getSpace();
    const { data, error } = await loadChallenges(supabase, space.ownerId, formatDate(new Date()));
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

/** Starts a challenge today. */
export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof challengeSchema>;
  try {
    body = challengeSchema.parse(await req.json());
  } catch (e) {
    const issue = e instanceof z.ZodError ? e.issues[0]?.message : undefined;
    return NextResponse.json({ error: issue ?? 'Data tidak valid' }, { status: 400 });
  }
  try {
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const today = formatDate(new Date());

    if (body.categoryId) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('id', body.categoryId)
        .eq('user_id', space.ownerId)
        .eq('type', 'expense')
        .maybeSingle();
      if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 400 });
    }

    const { data: current, error: loadError } = await loadChallenges(supabase, space.ownerId, today);
    if (loadError) return NextResponse.json({ error: loadError.message }, { status: 400 });
    if ((current?.challenges ?? []).filter((c) => c.progress.status === 'active').length >= MAX_ACTIVE_CHALLENGES) {
      return NextResponse.json(
        { error: `Paling banyak ${MAX_ACTIVE_CHALLENGES} tantangan berjalan bersamaan. Selesaikan atau hapus salah satu dulu.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        user_id: space.ownerId,
        category_id: body.categoryId,
        length_days: body.lengthDays,
        target_days: body.targetDays,
        start_date: today,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
