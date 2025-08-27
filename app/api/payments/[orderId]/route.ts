import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: { orderId: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("order_id", params.orderId)
      .single();
    if (error) throw error;
    return NextResponse.json({
      payment: {
        id: data.id,
        userId: data.user_id,
        orderId: data.order_id,
        productName: data.product_name,
        amount: data.amount,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Payment not found" },
      { status: 404 },
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getUser();
    const { status } = await req.json();
    const supabase = createClient();
    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("user_id", user.id)
      .eq("order_id", params.orderId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Failed to update payment" },
      { status: 500 },
    );
  }
}
