/**
 * Local notifications for the iOS/Android app: what to schedule on the phone
 * (bills due tomorrow, a daily nudge to record, the monthly report) and which
 * budget alerts to raise now. Scheduling itself lives in
 * components/notifications/notification-sync.tsx; this file is pure.
 */

export const NOTIFY_KEY = 'saku_notify';
export const ALERTS_KEY = 'saku_budget_alerts';

export interface NotifySettings {
  bills: boolean;
  budget: boolean;
  daily: boolean;
  report: boolean;
}

export const DEFAULT_NOTIFY: NotifySettings = { bills: true, budget: true, daily: true, report: true };

export function parseNotifySettings(raw: string | null): NotifySettings {
  try {
    return { ...DEFAULT_NOTIFY, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export interface PlannedNotification {
  /** Stable for the same event, so rescheduling replaces rather than doubles. */
  id: number;
  title: string;
  body: string;
  at: Date;
  /** Page opened when the notification is tapped. */
  url: string;
}

type T = (id: string, en: string) => string;

/** A positive 31-bit id from a string (Android needs 32-bit ints). */
export function notificationId(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return (h & 0x7fffffff) || 1;
}

/** `date` (YYYY-MM-DD) at a local hour on the device. */
const at = (date: string, hour: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0);
};
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export interface PlanInput {
  settings: NotifySettings;
  now: Date;
  /** Today in Jakarta, YYYY-MM-DD. */
  today: string;
  recurring: { id: string; type: string; active: boolean; amount: number; note: string; nextDate: string; endDate?: string | null; category?: { name: string } | null }[];
  /** True once something is recorded today: no evening nudge then. */
  recordedToday: boolean;
  /** First day of the next budget period, and the month whose report it brings. */
  nextPeriodStart: string;
  reportMonth: string;
  reportLabel: string;
  formatMoney: (n: number) => string;
  t: T;
}

/**
 * Everything to have scheduled on the phone right now, replacing what was
 * there: each bill due within the next 30 days the morning before (09:00),
 * the 20:00 nudge for the next 7 days, and the report on the new period's
 * first morning (08:00). Times already past are dropped.
 */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  const { settings, now, today, t } = input;
  const out: PlannedNotification[] = [];

  if (settings.bills) {
    const until = addDays(today, 30);
    for (const r of input.recurring) {
      if (!r.active || r.type !== 'expense' || r.nextDate > until) continue;
      if (r.endDate && r.nextDate > r.endDate) continue;
      const name = r.note || r.category?.name || t('Tagihan', 'Bill');
      out.push({
        id: notificationId(`bill:${r.id}:${r.nextDate}`),
        title: t('Tagihan besok', 'Bill due tomorrow'),
        body: t(`${name} ${input.formatMoney(r.amount)} jatuh tempo besok.`, `${name} ${input.formatMoney(r.amount)} is due tomorrow.`),
        at: at(addDays(r.nextDate, -1), 9),
        url: '/recurring',
      });
    }
  }

  if (settings.daily) {
    for (let i = input.recordedToday ? 1 : 0; i < 7; i++) {
      const day = addDays(today, i);
      out.push({
        id: notificationId(`daily:${day}`),
        title: t('Sudah catat hari ini?', 'Recorded today?'),
        body: t('Catat pengeluaran hari ini selagi masih ingat.', 'Note down today’s spending while you still remember.'),
        at: at(day, 20),
        url: '/dashboard',
      });
    }
  }

  if (settings.report) {
    out.push({
      id: notificationId(`report:${input.reportMonth}`),
      title: t(`Laporan ${input.reportLabel} sudah siap`, `Your ${input.reportLabel} report is ready`),
      body: t('Lihat berapa yang tersisihkan dan ke mana uangmu pergi.', 'See what you put aside and where your money went.'),
      at: at(input.nextPeriodStart, 8),
      url: `/reports/monthly?month=${input.reportMonth}`,
    });
  }

  return out.filter((n) => n.at > now);
}

/** Budget alerts already raised this period: category id -> highest level (80 or 100). */
export type AlertState = { month: string; sent: Record<string, 80 | 100> };

/**
 * Budgets that crossed 80% or 100% since the last check, and the state to
 * store so each level is raised once per period.
 */
export function budgetAlerts(
  month: string,
  usage: { categoryId: string; pct: number }[],
  state: AlertState | null
): { alerts: { categoryId: string; level: 80 | 100 }[]; state: AlertState } {
  const sent = state?.month === month ? { ...state.sent } : {};
  const alerts: { categoryId: string; level: 80 | 100 }[] = [];
  for (const u of usage) {
    const level = u.pct >= 100 ? 100 : u.pct >= 80 ? 80 : null;
    if (!level || (sent[u.categoryId] ?? 0) >= level) continue;
    sent[u.categoryId] = level;
    alerts.push({ categoryId: u.categoryId, level });
  }
  return { alerts, state: { month, sent } };
}
