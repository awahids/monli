"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Transaction, CategorySpend } from "@/types";
import { formatMoney, formatMoneyCompact } from "@/lib/currency";
import { budgetPeriod, daysBetweenInclusive } from "@/lib/date";
import { useT } from '@/lib/i18n';

interface Props {
  transactions: Transaction[];
  categorySpends: CategorySpend[];
  /** Budget month shown; its period may start on payday (e.g. 26 Sep – 25 Oct). */
  month: string;
  startDay: number;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
};

export function DashboardCharts({ transactions, categorySpends, month, startDay }: Props) {
  const { t } = useT();
  const dailyExpenses = useMemo(() => {
    const { start, end } = budgetPeriod(month, startDay);
    const totals = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.type === "expense" && t.budgetMonth === month && t.actualDate) {
        totals.set(t.actualDate, (totals.get(t.actualDate) ?? 0) + t.amount);
      }
    });
    // One point per day of the period, labelled by day of month.
    return Array.from({ length: daysBetweenInclusive(start, end) }, (_, i) => {
      const key = new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
      return { day: String(Number(key.slice(8, 10))), amount: totals.get(key) ?? 0 };
    });
  }, [transactions, month, startDay]);

  const hasDaily = dailyExpenses.some((d) => d.amount > 0);
  const pieData = useMemo(
    () =>
      categorySpends
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map((c) => ({ name: c.categoryName, value: c.amount, color: c.color })),
    [categorySpends]
  );
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Pengeluaran harian periode ini', 'Daily spending this period')}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasDaily ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyExpenses} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    width={64}
                    tickFormatter={(v) => formatMoneyCompact(v)}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value), t('Pengeluaran', 'Spending')]}
                    labelFormatter={(day) => t(`Tanggal ${day}`, `Day ${day}`)}
                    contentStyle={tooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#fillExpenses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title={t('Belum ada pengeluaran periode ini', 'No spending this period yet')}
              description={t('Grafik akan muncul setelah kamu mencatat pengeluaran.', 'The chart appears once you record spending.')}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Pengeluaran per kategori', 'Spending by category')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={tooltipStyle}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color || "hsl(var(--chart-1))"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">{t('Total', 'Total')}</span>
                  <span className="text-sm font-semibold">{formatMoneyCompact(pieTotal)}</span>
                </div>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {pieData.slice(0, 6).map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color || "hsl(var(--chart-1))" }} />
                    <span className="min-w-0 flex-1 truncate">{d.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round((d.value / pieTotal) * 100)}%
                    </span>
                    <span className="w-24 text-right font-medium tabular-nums">{formatMoneyCompact(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon={PieIcon}
              title={t('Belum ada data kategori', 'No category data yet')}
              description={t(
                'Pilih kategori saat mencatat pengeluaran untuk melihat ke mana uangmu pergi.',
                'Pick a category when recording spending to see where your money goes.'
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
