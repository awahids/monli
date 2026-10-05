import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { syncPaymentStatus } from "@/lib/midtrans";

interface Params {
  params: { orderId: string };
}

async function loadPayment(orderId: string) {
  const user = await getUser();
  const supabase = createClient();
  // RLS limits this to the caller's own payments.
  const { data, error } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("order_id", orderId)
    .single();
  if (error || !data) throw new Error("Payment not found");

  const payment = await syncPaymentStatus(orderId);
  return NextResponse.json({
    payment: {
      id: payment.id,
      userId: payment.user_id,
      orderId: payment.order_id,
      productName: payment.product_name,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.created_at,
    },
  });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    return await loadPayment(params.orderId);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Payment not found" },
      { status: 404 },
    );
  }
}

// Kept for older clients: the request body is ignored and the status is
// re-checked with Midtrans instead of being trusted.
export async function PATCH(_req: Request, { params }: Params) {
  try {
    return await loadPayment(params.orderId);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Failed to update payment" },
      { status: 404 },
    );
  }
}
