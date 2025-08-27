import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) {
    return NextResponse.json(
      { error: "Midtrans keys not configured" },
      { status: 500 },
    );
  }

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey,
      clientKey,
    });

    const orderId = `${user.id}-${Date.now()}`;
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: 50000,
      },
      item_details: [
        {
          id: "pro-plan",
          price: 50000,
          quantity: 1,
          name: "Pro Plan Subscription",
        },
      ],
      customer_details: {
        email: user.email,
      },
    });

    const supabase = createClient();
    const { error } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      product_name: "Pro Plan Subscription",
      amount: 50000,
      status: "pending",
      token: transaction.token,
    });
    if (error) throw error;

    return NextResponse.json({ token: transaction.token, orderId });
  } catch (e) {
    const err = e as {
      httpStatusCode?: number;
      ApiResponse?: { error_messages?: string[] };
      message?: string;
    };
    const status = err.httpStatusCode ?? 500;
    const message =
      err.ApiResponse?.error_messages?.join(", ") || err.message || "Unknown error";
    return NextResponse.json({ error: message }, { status });
  }
}
