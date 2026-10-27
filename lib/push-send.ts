/**
 * Sending Web Push from the server (the cron routes and the test button).
 * Server only: it holds the VAPID private key.
 */
import webpush from 'web-push';
import type { createAdminClient } from '@/lib/supabase/admin';
import { pushPayload } from '@/lib/push';

type Admin = ReturnType<typeof createAdminClient>;
export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/** False when the VAPID keys are not set: Web Push is off for this deployment. */
export function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'https://monli.fun', publicKey, privateKey);
  return true;
}

/** The cron routes are called by pg_cron and the database with this secret only. */
export function isCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Sends one notification to each target; subscriptions the push service no
 * longer knows (404/410) are removed. Returns how many were delivered.
 */
export async function sendPush(
  admin: Admin,
  targets: PushTarget[],
  n: { title: string; body: string; url: string }
): Promise<number> {
  let sent = 0;
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, pushPayload(n), {
          TTL: 60 * 60,
        });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.endpoint);
      }
    })
  );
  if (gone.length) await admin.from('push_subscriptions').delete().in('endpoint', gone);
  return sent;
}
