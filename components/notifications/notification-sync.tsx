'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Category, RecurringTransaction } from '@/types';
import type { BudgetUsage } from '@/lib/dashboard';
import { formatMoney } from '@/lib/currency';
import { isNativeApp } from '@/lib/native';
import {
  ALERTS_KEY,
  NOTIFY_KEY,
  budgetAlertText,
  budgetAlerts,
  notificationId,
  parseNotifySettings,
  planNotifications,
  type AlertState,
} from '@/lib/notifications';
import { useT } from '@/lib/i18n';
import { syncPushSchedule } from '@/lib/web-push';

const SOURCE = 'saku';

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** The notification plugin, or null on the web and in app builds that predate it. */
export async function notificationsPlugin() {
  if (!isNativeApp()) return null;
  const { LocalNotifications } = await import('@/lib/native-plugins');
  try {
    await LocalNotifications.checkPermissions();
    return LocalNotifications;
  } catch {
    return null;
  }
}

/**
 * Keeps the phone's scheduled notifications (or, in a browser with Web Push
 * on, the server's schedule) in step with the data on the home screen
 * (re-run whenever it changes), and raises budget alerts as they cross
 * 80% and 100%: as a notification in the app, as a toast on the web.
 */
export function useNotificationSync({
  ready,
  recurring,
  recordedToday,
  today,
  nextPeriodStart,
  reportMonth,
  reportLabel,
  budgetMonth,
  usage,
  categories,
}: {
  ready: boolean;
  recurring: RecurringTransaction[];
  recordedToday: boolean;
  today: string;
  nextPeriodStart: string;
  reportMonth: string;
  reportLabel: string;
  budgetMonth: string;
  usage: BudgetUsage[];
  categories: Category[];
}) {
  const { t } = useT();

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const settings = parseNotifySettings(read(NOTIFY_KEY));
      const plugin = await notificationsPlugin();
      const granted = plugin && (await plugin.checkPermissions()).display === 'granted';

      const plan = planNotifications({
        settings,
        now: new Date(),
        today,
        recurring,
        recordedToday,
        nextPeriodStart,
        reportMonth,
        reportLabel,
        formatMoney,
        t,
      });
      if (granted && !cancelled) {
        const { notifications: pending } = await plugin.getPending();
        const ours = pending.filter((n) => n.extra?.source === SOURCE).map((n) => ({ id: n.id }));
        if (ours.length) await plugin.cancel({ notifications: ours });
        if (plan.length && !cancelled) {
          await plugin.schedule({
            notifications: plan.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              schedule: { at: n.at, allowWhileIdle: true },
              extra: { source: SOURCE, url: n.url },
            })),
          });
        }
      }
      // Installed web app with push on: the server sends the same plan, and
      // the budget alerts as expenses are saved (app/api/cron/budget-alerts).
      const pushOn = !plugin && !cancelled && (await syncPushSchedule(plan, settings.budget).catch(() => false));

      if (!settings.budget || pushOn || cancelled) return;
      let state: AlertState | null = null;
      try {
        state = JSON.parse(read(ALERTS_KEY) ?? 'null');
      } catch {}
      const { alerts, state: next } = budgetAlerts(budgetMonth, usage, state);
      try {
        localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
      } catch {}
      const names = new Map(categories.map((c) => [c.id, c.name]));
      for (const a of alerts) {
        const name = names.get(a.categoryId) ?? '';
        const { title, body } = budgetAlertText(name, a.level, t);
        if (granted) {
          await plugin.schedule({
            notifications: [
              {
                id: notificationId(`budget:${budgetMonth}:${a.categoryId}:${a.level}`),
                title,
                body,
                schedule: { at: new Date(Date.now() + 1000) },
                extra: { source: `${SOURCE}-alert`, url: '/budgets' },
              },
            ],
          });
        } else {
          toast.warning(title, { description: body });
        }
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready, recurring, recordedToday, today, nextPeriodStart, reportMonth, reportLabel, budgetMonth, usage, categories, t]);
}
