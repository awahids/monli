import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { currentMonth } from '@/lib/date';

export type AiFeature = 'ocr' | 'chat';

/** Monthly quota per feature for PRO users without ai_unlimited. */
export const AI_MONTHLY_LIMITS: Record<AiFeature, number> = {
  chat: 10,
  ocr: 30,
};

/** Start of the current month in Asia/Jakarta, as an ISO timestamp. */
export function quotaPeriodStart(now: Date = new Date()): string {
  return new Date(`${currentMonth(now)}-01T00:00:00+07:00`).toISOString();
}

/** Uses of `feature` in the current quota period (the Jakarta calendar month). */
export async function getAiUsageCount(
  supabase: SupabaseClient<Database>,
  email: string,
  feature: AiFeature
): Promise<number> {
  const { count } = await supabase
    .from('ai_logs')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('feature', feature)
    .gte('created_at', quotaPeriodStart());
  return count ?? 0;
}

export async function logAiUsage(
  supabase: SupabaseClient<Database>,
  email: string,
  feature: AiFeature
): Promise<void> {
  const { error } = await supabase.from('ai_logs').insert({ email, feature });
  if (error) {
    console.error('Failed to log AI usage', error);
  }
}
