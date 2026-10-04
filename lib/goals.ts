export interface GoalProgress {
  pct: number;
  remaining: number;
  done: boolean;
  /** Whole months left until the target date (0 when due this month), null without a date. */
  monthsLeft: number | null;
  /** Amount to save per month to reach the target on time, null without a date or when done. */
  perMonth: number | null;
  overdue: boolean;
}

/** Months between two YYYY-MM-DD dates, counted by calendar month. */
function monthsBetween(from: string, to: string) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function goalProgress(
  goal: { targetAmount: number; savedAmount: number; targetDate?: string | null },
  today: string,
): GoalProgress {
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const done = remaining === 0;
  const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
  if (!goal.targetDate) return { pct, remaining, done, monthsLeft: null, perMonth: null, overdue: false };

  const overdue = !done && goal.targetDate < today;
  const monthsLeft = Math.max(monthsBetween(today, goal.targetDate), 0);
  // This month counts as one saving period, so a goal due this month needs everything now.
  const perMonth = done || overdue ? null : Math.ceil(remaining / (monthsLeft + 1));
  return { pct, remaining, done, monthsLeft, perMonth, overdue };
}
