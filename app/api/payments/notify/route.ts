import { NextResponse } from "next/server";
import { isValidSignature, syncPaymentStatus } from "@/lib/midtrans";

// Midtrans HTTP notification (set as Payment Notification URL in the Midtrans
// dashboard: https://<domain>/api/payments/notify). Upgrades the plan even when
// the user closed the Snap popup before the payment settled.
export async function POST(req: Request) {
  let payload: Record<string, string>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.order_id || !isValidSignature(payload)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const payment = await syncPaymentStatus(payload.order_id);
    return NextResponse.json({ ok: true, status: payment.status });
  } catch (e) {
    const message = (e as Error).message || "Failed to process notification";
    // Unknown orders are acknowledged so Midtrans stops retrying.
    if (message === "Payment not found") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
