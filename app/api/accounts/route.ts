import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import { accountSchema } from "@/lib/validation";
import { z } from "zod";

export async function GET(req: Request) {
  const supabase = createClient();
  try {
    const user = await getUser();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
      .from("accounts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (!includeArchived) {
      query = query.eq("archived", false);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(fromIdx, toIdx);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data ?? []).map((acc) => ({
      id: acc.id,
      userId: acc.user_id,
      name: acc.name,
      type: acc.type,
      currency: acc.currency,
      openingBalance: acc.opening_balance,
      archived: acc.archived,
      accountNumber: acc.account_number ?? undefined,
      currentBalance: acc.current_balance,
    }));

    return NextResponse.json({ rows, page, pageSize, total: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  let body: z.infer<typeof accountSchema>;
  try {
    body = accountSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        currency: body.currency ?? "IDR",
        opening_balance: body.openingBalance ?? 0,
        current_balance: body.openingBalance ?? 0,
        archived: body.archived ?? false,
        account_number: body.accountNumber ?? null,
      })
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create account" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      currency: data.currency,
      openingBalance: data.opening_balance,
      archived: data.archived,
      accountNumber: data.account_number ?? undefined,
      currentBalance: data.current_balance,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
