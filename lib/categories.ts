import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const DEFAULT_CATEGORIES = [
  { name: 'Makan', type: 'expense' as const, color: '#ef4444', icon: 'Utensils' },
  { name: 'Transportasi', type: 'expense' as const, color: '#3b82f6', icon: 'Car' },
  { name: 'Belanja', type: 'expense' as const, color: '#f59e0b', icon: 'ShoppingBag' },
  { name: 'Hiburan', type: 'expense' as const, color: '#a855f7', icon: 'Gamepad2' },
  { name: 'Gaji', type: 'income' as const, color: '#10b981', icon: 'Wallet' },
];

export async function ensureDefaultCategories(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!error && data.length === 0) {
    await supabase
      .from('categories')
      .insert(
        DEFAULT_CATEGORIES.map((c) => ({
          user_id: userId,
          ...c,
        })),
      );
  }
}
