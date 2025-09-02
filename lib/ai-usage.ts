import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type AiFeature = 'ocr' | 'chat';

export async function getAiUsageCount(
  supabase: SupabaseClient<Database>,
  email: string,
  feature: AiFeature
): Promise<number> {
  const { count } = await supabase
    .from('ai_logs')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('feature', feature);
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
