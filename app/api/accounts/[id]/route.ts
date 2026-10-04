import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import { accountSchema } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  let body: Partial<z.infer<typeof accountSchema>>;
  try {
    body = accountSchema.partial().parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  try {
    const user = await getUser();
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.openingBalance !== undefined)
      updates.opening_balance = body.openingBalance;
    if (body.archived !== undefined) updates.archived = body.archived;
    if (body.accountNumber !== undefined)
      updates.account_number = body.accountNumber;

    const { data, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Not found" },
        { status: 404 },
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

// Default: archive (soft delete). With ?permanent=true the account is removed,
// which only succeeds when no transactions reference it.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";
  try {
    const user = await getUser();
    if (!permanent) {
      const { error } = await supabase
        .from("accounts")
        .update({ archived: true })
        .eq("id", params.id)
        .eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);
    if (error) {
      // 23503 = foreign_key_violation (transactions still reference it)
      if (error.code === "23503") {
        return NextResponse.json(
          {
            error:
              "This account still has transactions. Archive it instead, or delete its transactions first.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
