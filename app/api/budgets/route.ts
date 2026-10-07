import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpace, readOnlyResponse } from "@/lib/auth/server";
import { budgetSchema } from "@/lib/validation";
import { z } from "zod";
import { selectAll } from "@/lib/select-all";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "12", 10), 240);
  const offset = (page - 1) * pageSize;

  if (year !== "all" && !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: "invalid year" }, { status: 400 });
  }

  try {
    const space = await getSpace();
    let query = supabase
      .from("budgets")
      .select("id, month, total_amount, carry", { count: "exact" })
      .eq("user_id", space.ownerId);
    if (year !== "all") query = query.like("month", `${year}-%`);
    const {
      data: budgets,
      error,
      count,
    } = await query
      .order("month", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!budgets || budgets.length === 0) {
      return NextResponse.json({ data: [], total: count || 0 });
    }
    // Actual spending is attributed by budget_month (the budget rule).
    const { data: tx, error: txError } = await selectAll((from, to) =>
      supabase
        .from("transactions")
        .select("amount, budget_month")
        .eq("user_id", space.ownerId)
        .eq("type", "expense")
        .in(
          "budget_month",
          budgets.map((b) => b.month),
        )
        .order("id")
        .range(from, to),
    );
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
      // Includes what the previous period carried over (see saku.carry).
      planned: b.total_amount + (b.carry ?? 0),
      carry: b.carry ?? 0,
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
    const space = await getSpace();
    if (!space.canWrite) return readOnlyResponse();
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", space.ownerId)
      .single();

    if (profile?.plan === "FREE") {
      const { count } = await supabase
        .from("budgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", space.ownerId);

      if ((count ?? 0) >= 2) {
        const { data: existing } = await supabase
          .from("budgets")
          .select("id")
          .eq("user_id", space.ownerId)
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

    // A new period keeps the rollover choice of the one before it.
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", space.ownerId)
      .eq("month", body.month)
      .maybeSingle();
    let rollover: boolean | undefined;
    if (!existing) {
      const [y, m] = body.month.split("-").map(Number);
      const prevMonth = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
      const { data: prev } = await supabase
        .from("budgets")
        .select("rollover")
        .eq("user_id", space.ownerId)
        .eq("month", prevMonth)
        .maybeSingle();
      rollover = prev?.rollover ?? false;
    }
    const { data: budget, error } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: space.ownerId,
          month: body.month,
          total_amount: body.totalAmount,
          ...(rollover !== undefined && { rollover }),
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
