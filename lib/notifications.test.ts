import { test } from 'node:test';
import assert from 'node:assert';
import { budgetAlertText, budgetAlerts, DEFAULT_NOTIFY, notificationId, parseNotifySettings, planNotifications, type PlanInput } from './notifications';

const t = (id: string) => id;
const base: PlanInput = {
  settings: DEFAULT_NOTIFY,
  now: new Date(2026, 2, 10, 12, 0), // 10 March, noon
  today: '2026-03-10',
  recurring: [],
  recordedToday: false,
  nextPeriodStart: '2026-04-01',
  reportMonth: '2026-03',
  reportLabel: 'Maret',
  formatMoney: (n) => `Rp${n}`,
  t,
};

test('bills are announced the morning before they are due, within 30 days', () => {
  const plan = planNotifications({
    ...base,
    settings: { ...DEFAULT_NOTIFY, daily: false, report: false },
    recurring: [
      { id: 'net', type: 'expense', active: true, amount: 300000, note: 'Internet', nextDate: '2026-03-15' },
      { id: 'pay', type: 'income', active: true, amount: 1, note: 'Gaji', nextDate: '2026-03-15' },
      { id: 'off', type: 'expense', active: false, amount: 1, note: 'Off', nextDate: '2026-03-15' },
      { id: 'far', type: 'expense', active: true, amount: 1, note: 'Far', nextDate: '2026-05-01' },
      { id: 'now', type: 'expense', active: true, amount: 1, note: 'Today', nextDate: '2026-03-10' }, // reminder time passed
    ],
  });
  assert.deepEqual(
    plan.map((n) => [n.body, n.at.getDate(), n.at.getHours(), n.url]),
    [['Internet Rp300000 jatuh tempo besok.', 14, 9, '/recurring']]
  );
});

test('the evening nudge skips today once something is recorded', () => {
  const only = { ...DEFAULT_NOTIFY, bills: false, report: false };
  assert.equal(planNotifications({ ...base, settings: only }).length, 7);
  const after = planNotifications({ ...base, settings: only, recordedToday: true });
  assert.equal(after.length, 6);
  assert.equal(after[0].at.getDate(), 11);
  assert.equal(after[0].at.getHours(), 20);
});

test('the report comes on the first morning of the new period', () => {
  const [report] = planNotifications({ ...base, settings: { ...DEFAULT_NOTIFY, bills: false, daily: false } });
  assert.equal(report.title, 'Laporan Maret sudah siap');
  assert.equal(report.url, '/reports/monthly?month=2026-03');
  assert.deepEqual([report.at.getMonth(), report.at.getDate(), report.at.getHours()], [3, 1, 8]);
});

test('notification ids are stable positive 31-bit ints', () => {
  assert.equal(notificationId('bill:a:2026-03-15'), notificationId('bill:a:2026-03-15'));
  assert.notEqual(notificationId('bill:a:2026-03-15'), notificationId('bill:a:2026-04-15'));
  assert.ok(notificationId('x') > 0 && notificationId('x') <= 0x7fffffff);
});

test('budget alerts fire once per level per period', () => {
  const first = budgetAlerts('2026-03', [{ categoryId: 'food', pct: 85 }, { categoryId: 'fun', pct: 40 }], null);
  assert.deepEqual(first.alerts, [{ categoryId: 'food', level: 80 }]);
  const again = budgetAlerts('2026-03', [{ categoryId: 'food', pct: 90 }], first.state);
  assert.deepEqual(again.alerts, []);
  const over = budgetAlerts('2026-03', [{ categoryId: 'food', pct: 104 }], again.state);
  assert.deepEqual(over.alerts, [{ categoryId: 'food', level: 100 }]);
  const nextPeriod = budgetAlerts('2026-04', [{ categoryId: 'food', pct: 81 }], over.state);
  assert.deepEqual(nextPeriod.alerts, [{ categoryId: 'food', level: 80 }]);
});

test('each reminder says its kind, so the server can skip a nudge once something is recorded', () => {
  const plan = planNotifications({
    ...base,
    recurring: [{ id: 'net', type: 'expense', active: true, amount: 1, note: 'Internet', nextDate: '2026-03-15' }],
  });
  assert.deepEqual(Array.from(new Set(plan.map((n) => n.kind))).sort(), ['bill', 'daily', 'report']);
});

test('budget alert text names the category and the level', () => {
  assert.equal(budgetAlertText('Makan', 80, t).title, 'Budget Makan tinggal 20%');
  assert.equal(budgetAlertText('Makan', 100, t).title, 'Budget Makan habis');
});

test('settings fall back to everything on', () => {
  assert.deepEqual(parseNotifySettings(null), DEFAULT_NOTIFY);
  assert.deepEqual(parseNotifySettings('{"daily":false}'), { ...DEFAULT_NOTIFY, daily: false });
  assert.deepEqual(parseNotifySettings('nope'), DEFAULT_NOTIFY);
});
