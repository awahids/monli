import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { getUser } from "@/lib/auth/server";

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
      isProduction: process.env.NODE_ENV === "production",
      serverKey,
      clientKey,
    });
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: `${user.id}-${Date.now()}`,
        gross_amount: 50000,
      },
      customer_details: {
        email: user.email,
      },
    });
    return NextResponse.json({ token: transaction.token });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
