import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import { budgetSchema } from "@/lib/validation";
import { z } from "zod";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);
  const offset = (page - 1) * pageSize;

  try {
    const user = await getUser();
    const {
      data: budgets,
      error,
      count,
    } = await supabase
      .from("budgets")
      .select("id, month, total_amount", { count: "exact" })
      .eq("user_id", user.id)
      .like("month", `${year}-%`)
      .order("month", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!budgets || budgets.length === 0) {
      return NextResponse.json({ data: [], total: count || 0 });
    }
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("amount, budget_month")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .like("budget_month", `${year}-%`);
    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 400 });
    }
    const actualByMonth: Record<string, number> = {};
    for (const t of tx || []) {
      const monthKey = t.budget_month;
      actualByMonth[monthKey] = (actualByMonth[monthKey] || 0) + t.amount;
    }
    const result = budgets.map((b) => ({
      id: b.id,
      month: b.month,
      planned: b.total_amount,
      actual: actualByMonth[b.month] || 0,
    }));
    return NextResponse.json({ data: result, total: count || 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof budgetSchema>;
  try {
    body = budgetSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "FREE") {
      const { count } = await supabase
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= 2) {
        const { data: existing } = await supabase
          .from("budgets")
          .select("id")
          .eq("user_id", user.id)
          .eq("month", body.month)
          .single();
        if (!existing) {
          return NextResponse.json(
            { error: "Free plan limited to two budgets" },
            { status: 403 },
          );
        }
      }
    }

    const { data: budget, error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          month: body.month,
          total_amount: body.totalAmount,
        },
        { onConflict: "user_id, month" },
      )
      .select("id, month, total_amount")
      .single();
    if (error || !budget) {
      return NextResponse.json(
        { error: error?.message || "Insert failed" },
        { status: 400 },
      );
    }
    if (body.items.length) {
      const upserts = body.items.map((i) => ({
        budget_id: budget.id,
        category_id: i.categoryId,
        amount: i.amount,
        rollover: i.rollover ?? false,
      }));
      const { error: itemError } = await supabase
        .from("budget_items")
        .upsert(upserts, { onConflict: "budget_id, category_id" });
      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 400 });
      }
    }
    return NextResponse.json(budget);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
