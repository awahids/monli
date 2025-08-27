import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

function mapStatus(status: string) {
  switch (status) {
    case "settlement":
    case "capture":
      return "success";
    case "pending":
      return "pending";
    default:
      return "failed";
  }
}

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

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (serverKey && clientKey) {
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey,
        clientKey,
      });
      const res = await snap.transaction.status(data.order_id);
      const newStatus = mapStatus(res.transaction_status);
      if (newStatus !== data.status) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({ status: newStatus })
          .eq("id", data.id);
        if (updateError) throw updateError;
        data.status = newStatus;
      }
    }

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

    if (status === 'success') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: 'PRO' })
        .eq('id', user.id);
      if (profileError) throw profileError;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Failed to update payment" },
      { status: 500 },
    );
  }
}
