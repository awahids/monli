import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { createSumopodClient, getSumopodModel } from '@/lib/sumopod';
import { AI_MONTHLY_LIMITS, getAiUsageCount, logAiUsage } from '@/lib/ai-usage';
import { currentMonth, shiftMonth } from '@/lib/date';

export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  // Previous turns so follow-up questions keep their context.
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
});

// Bounded context: the last 6 months of transactions (at most 500 rows),
// with account/category names instead of ids and no account numbers.
const CONTEXT_MONTHS = 6;
const MAX_TRANSACTIONS = 500;
const HISTORY_TURNS = 6;

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Pesan wajib diisi' }, { status: 400 });
    }
    const { message, history = [] } = parsed.data;

    const supabase = createClient();
    const user = await getUser();

    if (!user.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, name, default_currency, ai_unlimited')
      .eq('id', user.id)
      .single();
    if (profile?.plan !== 'PRO') {
      return NextResponse.json(
        { error: 'Asisten AI hanya tersedia untuk paket PRO' },
        { status: 403 }
      );
    }
    const isUnlimited = profile.ai_unlimited;
    const count = await getAiUsageCount(supabase, user.email, 'chat');
    if (!isUnlimited && count >= AI_MONTHLY_LIMITS.chat) {
      return NextResponse.json(
        { error: `Kuota chat bulan ini (${AI_MONTHLY_LIMITS.chat}x) sudah habis. Kuota direset tiap awal bulan.` },
        { status: 403 }
      );
    }

    const since = `${shiftMonth(currentMonth(), -(CONTEXT_MONTHS - 1))}-01`;
    const [accountsRes, categoriesRes, budgetsRes, transactionsRes, goalsRes, recurringRes] =
      await Promise.all([
        supabase
          .from('accounts')
          .select('id, name, type, currency, current_balance, archived')
          .eq('user_id', user.id),
        supabase
          .from('categories')
          .select('id, name, type')
          .eq('user_id', user.id),
        supabase
          .from('budgets')
          .select('id, month, total_amount, items:budget_items(category_id, amount)')
          .eq('user_id', user.id)
          .gte('month', since.slice(0, 7)),
        supabase
          .from('transactions')
          .select('actual_date, budget_month, amount, type, account_id, from_account_id, to_account_id, category_id, note')
          .eq('user_id', user.id)
          .gte('actual_date', since)
          .order('actual_date', { ascending: false })
          .limit(MAX_TRANSACTIONS),
        supabase
          .from('savings_goals')
          .select('name, target_amount, saved_amount, target_date')
          .eq('user_id', user.id)
          .eq('archived', false),
        supabase
          .from('recurring_transactions')
          .select('type, amount, note, frequency, day_of_month, next_date, account_id, category_id')
          .eq('user_id', user.id)
          .eq('active', true),
      ]);

    const accountName = new Map((accountsRes.data ?? []).map((a) => [a.id, a.name]));
    const categoryName = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name]));

    const context = JSON.stringify({
      today: new Date().toISOString().slice(0, 10),
      currency: profile.default_currency,
      name: profile.name,
      accounts: (accountsRes.data ?? []).map(({ id: _id, ...a }) => a),
      categories: (categoriesRes.data ?? []).map((c) => ({ name: c.name, type: c.type })),
      budgets: (budgetsRes.data ?? []).map((b) => ({
        month: b.month,
        total: b.total_amount,
        items: ((b.items as { category_id: string; amount: number }[] | null) ?? []).map((i) => ({
          category: categoryName.get(i.category_id) ?? '',
          amount: i.amount,
        })),
      })),
      transactions: (transactionsRes.data ?? []).map((t) => ({
        date: t.actual_date,
        budget_month: t.budget_month,
        type: t.type,
        amount: t.amount,
        account: t.account_id ? accountName.get(t.account_id) : undefined,
        from: t.from_account_id ? accountName.get(t.from_account_id) : undefined,
        to: t.to_account_id ? accountName.get(t.to_account_id) : undefined,
        category: t.category_id ? categoryName.get(t.category_id) : undefined,
        note: t.note || undefined,
      })),
      savings_goals: (goalsRes.data ?? []).map((g) => ({
        name: g.name,
        target: g.target_amount,
        saved: g.saved_amount,
        target_date: g.target_date ?? undefined,
      })),
      recurring: (recurringRes.data ?? []).map((r) => ({
        type: r.type,
        amount: r.amount,
        note: r.note || undefined,
        frequency: r.frequency,
        day_of_month: r.day_of_month ?? undefined,
        next_date: r.next_date,
        account: r.account_id ? accountName.get(r.account_id) : undefined,
        category: r.category_id ? categoryName.get(r.category_id) : undefined,
      })),
      transactions_scope: `last ${CONTEXT_MONTHS} months, newest first, max ${MAX_TRANSACTIONS}`,
    });

    const client = createSumopodClient();
    const model = getSumopodModel();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Kamu adalah asisten keuangan di Qala Saku, aplikasi keuangan pribadi dari keluarga Qala. ' +
            'Jawab dalam Bahasa Indonesia yang santai dan jelas, hanya berdasarkan data pengguna di bawah. ' +
            'Kalau datanya tidak cukup, katakan terus terang. Gunakan Markdown singkat (poin-poin, tebalkan angka penting) ' +
            'dan format nominal dalam mata uang pengguna.\n\n' +
            `Data pengguna: ${context}`,
        },
        ...history.slice(-HISTORY_TURNS),
        { role: 'user', content: message },
      ],
      temperature: 0.4,
      max_tokens: 700,
    });

    const answer = completion.choices[0]?.message?.content || '';
    // Only successful answers count towards the quota.
    await logAiUsage(supabase, user.email, 'chat');
    return NextResponse.json({
      answer,
      usage: {
        unlimited: Boolean(isUnlimited),
        used: count + 1,
        limit: AI_MONTHLY_LIMITS.chat,
      },
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Gagal memproses chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
