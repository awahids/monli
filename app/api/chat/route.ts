import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { createSumopodClient, getSumopodModel } from '@/lib/sumopod';
import { getAiUsageCount, logAiUsage } from '@/lib/ai-usage';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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
        { error: 'Chat is available for PRO plan only' },
        { status: 403 }
      );
    }
    const isUnlimited = profile.ai_unlimited;
    const count = await getAiUsageCount(supabase, user.email, 'chat');
    if (!isUnlimited && count >= 10) {
      return NextResponse.json(
        { error: 'Chat usage limit reached' },
        { status: 403 }
      );
    }
    await logAiUsage(supabase, user.email, 'chat');

    const [accountsRes, categoriesRes, budgetsRes, transactionsRes, paymentsRes] =
      await Promise.all([
        supabase
          .from('accounts')
          .select(
            'name, type, currency, current_balance, opening_balance, archived, account_number'
          )
          .eq('user_id', user.id),
        supabase
          .from('categories')
          .select('name, type, color, icon')
          .eq('user_id', user.id),
        supabase
          .from('budgets')
          .select('id, month, total_amount')
          .eq('user_id', user.id),
        supabase
          .from('transactions')
          .select('date, amount, type, account_id, category_id, note, tags')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('payments')
          .select('order_id, product_name, amount, status, created_at')
          .eq('user_id', user.id),
      ]);

    const accounts = accountsRes.data;
    const categories = categoriesRes.data;
    const budgets = budgetsRes.data;
    const transactions = transactionsRes.data;
    const payments = paymentsRes.data;

    let budgetItems: any[] = [];
    if (budgets && budgets.length > 0) {
      const budgetIds = budgets.map((b) => b.id);
      const { data } = await supabase
        .from('budget_items')
        .select('budget_id, category_id, amount, rollover')
        .in('budget_id', budgetIds);
      budgetItems = data || [];
    }

    const context = JSON.stringify({
      profile,
      accounts,
      categories,
      budgets,
      budget_items: budgetItems,
      transactions,
      payments,
    });

    const client = createSumopodClient();
    const model = getSumopodModel();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful financial assistant. Use the provided user data to answer questions. Format responses in clean Markdown with headings and bullet points and begin with "Based on your financial data, here is a summary:" when summarizing.',
        },
        {
          role: 'user',
          content: `User data: ${context}\n\n${message}`,
        },
      ],
      temperature: 1,
      // Allow longer responses so summaries aren't truncated
      max_tokens: 600,
    });

    const answer = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ answer });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : 'Failed to process chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
