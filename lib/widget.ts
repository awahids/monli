import type { Translate } from '@/lib/locale';

/**
 * What the home screen widget (mobile/: Android SakuWidgetProvider, iOS
 * SakuWidget) shows, sent through the WidgetBridge plugin whenever Beranda
 * has fresh numbers. The widget keeps showing it until the next update.
 */
export interface WidgetSnapshot {
  label: string;
  value: string;
  detail: string;
  /** Shown small at the bottom, e.g. "Diperbarui 08.15". */
  updated: string;
}

export function widgetSnapshot(
  input: {
    budget: { daily: number; remaining: number; daysLeft: number; over: boolean } | null;
    spentToday: number;
    hidden: boolean;
    now: Date;
  },
  formatMoney: (n: number) => string,
  t: Translate
): WidgetSnapshot {
  const money = (n: number) => (input.hidden ? 'Rp •••••' : formatMoney(n));
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(input.now);
  const updated = t(`Diperbarui ${time}`, `Updated ${time}`);
  const { budget } = input;
  if (!budget) {
    return {
      label: t('Pengeluaran hari ini', 'Spent today'),
      value: money(input.spentToday),
      detail: t('Atur budget untuk jatah harian', 'Set a budget for a daily allowance'),
      updated,
    };
  }
  if (budget.over) {
    return {
      label: t('Budget terlampaui', 'Over budget'),
      value: money(-budget.remaining),
      detail: t(`${budget.daysLeft} hari lagi di periode ini`, `${budget.daysLeft} days left this period`),
      updated,
    };
  }
  return {
    label: t('Sisa jatah hari ini', "Today's allowance"),
    value: money(budget.daily),
    detail: t(`Sisa ${money(budget.remaining)} · ${budget.daysLeft} hari`, `${money(budget.remaining)} left · ${budget.daysLeft} days`),
    updated,
  };
}
