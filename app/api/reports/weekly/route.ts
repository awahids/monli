import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSpace } from '@/lib/auth/server';
import { formatDate } from '@/lib/date';
import { weekStart } from '@/lib/weekly-summary';
import { loadWeeklySummary } from '@/lib/weekly-summary-server';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  week: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid week. Use YYYY-MM-DD')
    .optional(),
});

/** The weekly summary (lib/weekly-summary.ts) of the week holding `week`, this week by default. */
export async function GET(req: Request) {
  const supabase = createClient();
  try {
    const space = await getSpace();
    const parse = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parse.success || (parse.data.week && Number.isNaN(Date.parse(parse.data.week)))) {
      return NextResponse.json({ error: parse.error?.issues[0]?.message ?? 'Invalid week' }, { status: 400 });
    }
    const today = formatDate(new Date());
    const start = weekStart(parse.data.week ?? today);
    if (start > today) return NextResponse.json({ error: 'Minggu ini belum dimulai' }, { status: 400 });
    const { data, error } = await loadWeeklySummary(supabase, space.ownerId, start, today);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
