'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SavingsGoal } from '@/types';
import { keysToCamel } from '@/lib/case';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { goalProgress } from '@/lib/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/transactions/category-icon';

/** Up to three active savings goals; renders nothing until the user has one. */
export function GoalsSummary() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/goals')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.data) {
          setGoals(keysToCamel<SavingsGoal[]>(data.data).filter((g) => !g.archived));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!goals.length) return null;
  const today = formatDate(new Date());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Target tabungan</CardTitle>
        <Button asChild variant="ghost" size="sm" className="-mr-2">
          <Link href="/goals">Lihat semua</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {goals.slice(0, 3).map((g) => {
          const p = goalProgress(g, today);
          const color = g.color || '#14A7A0';
          return (
            <Link key={g.id} href="/goals" className="space-y-2 rounded-lg p-1 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <CategoryIcon name={g.icon || 'PiggyBank'} className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-sm font-medium">{g.name}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{Math.floor(p.pct)}%</span>
              </div>
              <Progress value={p.pct} className="h-1.5" indicatorStyle={{ backgroundColor: color }} />
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(g.savedAmount)} / {formatMoney(g.targetAmount)}
              </p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
