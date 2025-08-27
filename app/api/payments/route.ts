import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("id, order_id, product_name, amount, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      payments: data?.map((p) => ({
        id: p.id,
        orderId: p.order_id,
        productName: p.product_name,
        amount: p.amount,
        status: p.status,
        createdAt: p.created_at,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Failed to load payments" },
      { status: 500 },
    );
  }
}
