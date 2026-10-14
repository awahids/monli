import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnap } from "@/lib/midtrans";
import { PRO_PLANS, type ProPeriod } from "@/lib/plans";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const period: ProPeriod = body?.period === "yearly" ? "yearly" : "monthly";
  const { months, price } = PRO_PLANS[period];
  const productName = `Qala Saku Pro ${months} bulan`;

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

    // PRO without an end date (granted by hand) has nothing to buy.
    const { data: profile, error: profileError } = await createClient()
      .from('profiles')
      .select('plan, pro_until')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.plan === 'PRO' && !profile.pro_until) {
      return NextResponse.json({ error: 'Already upgraded' }, { status: 400 });
    }

    const orderId = `${user.id}-${Date.now()}`;
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      item_details: [
        {
          id: `pro-${period}`,
          price,
          quantity: 1,
          name: productName,
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
      product_name: productName,
      amount: price,
      months,
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
