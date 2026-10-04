import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnap } from "@/lib/midtrans";
import { PRO_PRICE } from "@/lib/plans";

export async function POST() {
  const snap = getSnap();
  if (!snap) {
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

    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.plan === 'PRO') {
      return NextResponse.json(
        { error: 'Already upgraded' },
        { status: 400 },
      );
    }

    const orderId = `${user.id}-${Date.now()}`;
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: PRO_PRICE,
      },
      item_details: [
        {
          id: "pro-plan",
          price: PRO_PRICE,
          quantity: 1,
          name: "Qala Saku Pro",
        },
      ],
      customer_details: {
        email: user.email,
      },
    });

    // Payments are written with the service role; users can only read them.
    const { error } = await createAdminClient().from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      product_name: "Qala Saku Pro",
      amount: PRO_PRICE,
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
