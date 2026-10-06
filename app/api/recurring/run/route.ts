import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { dueOccurrences, type RecurringFrequency } from '@/lib/recurring';
import { budgetMonthFor, formatDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

type Rule = {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  account_id: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
  category_id: string | null;
  amount: number;
  note: string;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  next_date: string;
  end_date: string | null;
};

/**
 * Creates the transactions of every rule that is due (today in Asia/Jakarta)
 * and moves each rule to its next date. Called when the app opens; safe to
 * call repeatedly because each occurrence is unique per (rule, date).
 */
export async function POST() {
  const supabase = createClient();
  try {
    const user = await getUser();
    const today = formatDate(new Date());
    const { data: rules, error } = await supabase
      .from('recurring_transactions')
      .select('id, type, account_id, from_account_id, to_account_id, category_id, amount, note, frequency, day_of_month, next_date, end_date')
      .eq('user_id', user.id)
      .eq('active', true)
      .lte('next_date', today);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('budget_start_day')
      .eq('id', user.id)
      .maybeSingle();
    const startDay = profile?.budget_start_day ?? 1;

    let created = 0;
    for (const rule of (rules ?? []) as Rule[]) {
      const { dates, nextDate } = dueOccurrences(
        { frequency: rule.frequency, dayOfMonth: rule.day_of_month, nextDate: rule.next_date, endDate: rule.end_date },
        today,
      );

      if (dates.length) {
        const rows = dates.map((d) => ({
          user_id: user.id,
          recurring_id: rule.id,
          date: d,
          actual_date: d,
          budget_month: budgetMonthFor(d, startDay),
          type: rule.type,
          account_id: rule.account_id,
          from_account_id: rule.from_account_id,
          to_account_id: rule.to_account_id,
          category_id: rule.category_id,
          amount: rule.amount,
          note: rule.note,
          tags: ['rutin'],
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('transactions')
          .upsert(rows, { onConflict: 'recurring_id,actual_date', ignoreDuplicates: true })
          .select('id');
        if (insertError) {
          console.error('recurring run: insert failed', rule.id, insertError.message);
          continue;
        }
        created += inserted?.length ?? 0;
      }

      // Only advance from the date we read, so a concurrent run can't move it twice.
      await supabase
        .from('recurring_transactions')
        .update(nextDate ? { next_date: nextDate } : { active: false })
        .eq('id', rule.id)
        .eq('user_id', user.id)
        .eq('next_date', rule.next_date);
    }

    return NextResponse.json({ created });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
