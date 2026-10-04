import { createHash } from 'crypto';
import midtransClient from 'midtrans-client';
import { createAdminClient } from '@/lib/supabase/admin';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export function getSnap() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) return null;
  return new midtransClient.Snap({
    isProduction: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey,
  });
}

export function mapStatus(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentStatus {
  switch (transactionStatus) {
    case 'settlement':
      return 'success';
    case 'capture':
      // Card payments flagged "challenge" are not paid until reviewed.
      return !fraudStatus || fraudStatus === 'accept' ? 'success' : 'pending';
    case 'pending':
      return 'pending';
    default:
      return 'failed';
  }
}

/**
 * Midtrans notification signature: sha512(order_id + status_code + gross_amount + server_key).
 */
export function isValidSignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !payload.signature_key) return false;
  const expected = createHash('sha512')
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest('hex');
  return expected === payload.signature_key;
}

/**
 * Asks Midtrans for the authoritative status of an order and persists it.
 * When the order is paid in full, the owner is upgraded to PRO.
 * Never trust a status sent by the browser — always go through here.
 */
export async function syncPaymentStatus(orderId: string) {
  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();
  if (error || !payment) throw new Error('Payment not found');

  const snap = getSnap();
  if (!snap) return payment;

  let status: PaymentStatus;
  try {
    const res = await snap.transaction.status(orderId);
    status = mapStatus(res.transaction_status, res.fraud_status);
    if (status === 'success' && Number(res.gross_amount) < payment.amount) {
      status = 'failed';
    }
  } catch (e) {
    // Midtrans returns 404 until the user picks a payment method.
    const httpStatus = (e as { httpStatusCode?: number | string }).httpStatusCode;
    if (Number(httpStatus) === 404) return payment;
    throw e;
  }

  if (status !== payment.status) {
    const { error: updateError } = await admin
      .from('payments')
      .update({ status })
      .eq('id', payment.id);
    if (updateError) throw updateError;
    payment.status = status;
  }

  if (status === 'success') {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ plan: 'PRO' })
      .eq('id', payment.user_id);
    if (profileError) throw profileError;
  }

  return payment;
}
