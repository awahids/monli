/**
 * Web Push for the installed web app (PWA): the phone app schedules its
 * reminders on the device, a browser cannot, so the home screen uploads the
 * same plan (lib/notifications.ts) and the server sends each one when it is
 * due (app/api/cron/push). public/sw.js shows it and opens its page.
 */
import { isNativeApp } from '@/lib/native';
import { isStandalone } from '@/lib/pwa';
import type { PlannedNotification } from '@/lib/notifications';
import { keyBytes, schedulePayload } from '@/lib/push';

const PLAN_KEY = 'saku_push_plan';
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * - `on` / `off` / `denied`: this browser can get push; `off` means not yet allowed.
 * - `install`: iPhone/iPad Safari, which only allows push once added to the home screen.
 * - `unsupported`: no push here (or it is not configured, or this is the phone app).
 */
export type WebPushState = 'on' | 'off' | 'denied' | 'install' | 'unsupported';

/** The active service worker, or null when there is none soon (dev builds register none). */
async function registration() {
  if (!navigator.serviceWorker) return null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

export async function webPushState(): Promise<WebPushState> {
  if (typeof window === 'undefined' || isNativeApp() || !VAPID_KEY) return 'unsupported';
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone()) return 'install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registration();
  if (!reg) return 'unsupported';
  const sub = await reg.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Asks for permission, subscribes this browser and saves it on the server. */
export async function enableWebPush(): Promise<WebPushState> {
  const reg = await registration();
  if (!reg || !VAPID_KEY) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY) as BufferSource }));
  if (!(await saveSubscription(sub))) throw new Error('subscribe failed');
  forgetUploadedPlan();
  return 'on';
}

/** Ties this browser's subscription to whoever is signed in now, with its budget alert choice. */
async function saveSubscription(sub: PushSubscription, budgetAlerts?: boolean) {
  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sub.toJSON(), budgetAlerts }),
  });
  return res.ok;
}

export async function disableWebPush(): Promise<WebPushState> {
  const sub = await (await registration())?.pushManager.getSubscription();
  if (sub) {
    await fetch('/api/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  forgetUploadedPlan();
  return 'off';
}

function forgetUploadedPlan() {
  try {
    localStorage.removeItem(PLAN_KEY);
  } catch {}
}

/**
 * Uploads the plan (and whether budget alerts are wanted) when push is on
 * here and either changed since the last upload. The subscription is saved
 * again first, so after another account signs in on this browser its
 * reminders come here instead of the previous account's. True when push is on.
 */
export async function syncPushSchedule(plan: PlannedNotification[], budgetAlerts: boolean): Promise<boolean> {
  if ((await webPushState()) !== 'on') return false;
  const sub = await (await registration())?.pushManager.getSubscription();
  if (!sub) return false;
  const body = JSON.stringify(schedulePayload(plan));
  const stamp = `${budgetAlerts}:${body}`;
  let last: string | null = null;
  try {
    last = localStorage.getItem(PLAN_KEY);
  } catch {}
  if (last === stamp || !(await saveSubscription(sub, budgetAlerts))) return true;
  const res = await fetch('/api/push/schedule', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
  if (!res.ok) return true;
  try {
    localStorage.setItem(PLAN_KEY, stamp);
  } catch {}
  return true;
}

/** "Kirim notifikasi uji" for this browser; false when it did not arrive at the push service. */
export async function sendTestPush(): Promise<boolean> {
  const sub = await (await registration())?.pushManager.getSubscription();
  if (!sub) return false;
  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  return res.ok;
}
