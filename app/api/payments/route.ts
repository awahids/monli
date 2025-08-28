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

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (serverKey && clientKey && data) {
      const snap = new midtransClient.Snap({
        isProduction:
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true",
        serverKey,
        clientKey,
      });

      await Promise.all(
        data.map(async (p) => {
          const res = await snap.transaction.status(p.order_id);
          const newStatus = mapStatus(res.transaction_status);
          if (newStatus !== p.status) {
            await supabase
              .from("payments")
              .update({ status: newStatus })
              .eq("id", p.id);
            p.status = newStatus;
          }
        }),
      );
    }

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

