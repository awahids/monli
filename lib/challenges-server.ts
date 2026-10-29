import type { createClient } from '@/lib/supabase/server';
import { keysToCamel } from '@/lib/case';
import { selectAll } from '@/lib/select-all';
import { addDays } from '@/lib/weekly-summary';
import { challengeProgress, kantoMood, recordingStreak, type Challenge, type ChallengeProgress } from '@/lib/challenges';

/** A streak this long is plenty to show; older days are not read. */
const STREAK_DAYS = 400;

export type ChallengeWithProgress = Challenge & { progress: ChallengeProgress };

export interface ChallengesOverview {
  streak: { days: number; recordedToday: boolean };
  challenges: ChallengeWithProgress[];
  mood: 'cheer' | 'sad' | 'idle';
}

/** The owner's recording streak and challenges with their progress, as of `today`. */
export async function loadChallenges(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  today: string
): Promise<{ data: ChallengesOverview | null; error: { message: string } | null }> {
  const { data: rows, error } = await supabase
    .from('challenges')
    .select('id, category_id, length_days, target_days, start_date')
    .eq('user_id', ownerId)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return { data: null, error };
  const challenges = keysToCamel<Challenge[]>(rows ?? []);

  const since = challenges.reduce((min, c) => (c.startDate < min ? c.startDate : min), addDays(today, -STREAK_DAYS));
  const txs = await selectAll((from, to) =>
    supabase
      .from('transactions')
      .select('actual_date, type, category_id')
      .eq('user_id', ownerId)
      .gte('actual_date', since)
      .lte('actual_date', today)
      .order('id')
      .range(from, to)
  );
  if (txs.error) return { data: null, error: txs.error };

  const recorded = new Set<string>();
  const spentAll = new Set<string>();
  const spentIn = new Map<string, Set<string>>();
  for (const t of (txs.data ?? []) as { actual_date: string; type: string; category_id: string | null }[]) {
    recorded.add(t.actual_date);
    if (t.type !== 'expense') continue;
    spentAll.add(t.actual_date);
    if (!t.category_id) continue;
    if (!spentIn.has(t.category_id)) spentIn.set(t.category_id, new Set());
    spentIn.get(t.category_id)!.add(t.actual_date);
  }

  const streak = recordingStreak(recorded, today);
  const withProgress = challenges.map((c) => ({
    ...c,
    progress: challengeProgress(c, c.categoryId ? spentIn.get(c.categoryId) ?? new Set() : spentAll, today),
  }));
  return {
    data: { streak, challenges: withProgress, mood: kantoMood(streak, withProgress.map((c) => c.progress), today) },
    error: null,
  };
}
