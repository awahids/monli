/**
 * Pure helpers for Web Push, shared by the browser (lib/web-push.ts) and the
 * sender (app/api/cron/push).
 */
import type { PlannedNotification } from './notifications';

/** Reminders this late (the cron missed them) are dropped rather than sent. */
export const STALE_MS = 3 * 60 * 60 * 1000;

/** What public/sw.js receives in a push event. */
export function pushPayload(n: { title: string; body: string; url: string }): string {
  return JSON.stringify({ title: n.title, body: n.body, url: n.url });
}

/** The plan as uploaded: due times as ISO strings, in a stable order. */
export function schedulePayload(plan: PlannedNotification[]) {
  return {
    notifications: plan
      .map((n) => ({ id: n.id, title: n.title, body: n.body, url: n.url, at: n.at.toISOString() }))
      .sort((a, b) => a.at.localeCompare(b.at) || a.id - b.id),
  };
}

/** The VAPID public key (base64url) as the bytes PushManager.subscribe wants. */
export function keyBytes(base64url: string): Uint8Array {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
