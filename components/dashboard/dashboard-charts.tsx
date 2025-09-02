"use client";
// @ts-nocheck

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
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, CategorySpend } from "@/types";
import { formatIDR } from "@/lib/currency";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";

interface Props {
  transactions: Transaction[];
  categorySpends: CategorySpend[];
}

export function DashboardCharts({ transactions, categorySpends }: Props) {
  const dailyExpenses = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now),
    });

    return days.map(day => {
      const key = format(day, "yyyy-MM-dd");
      const amount = transactions
        .filter(t => t.type === "expense" && t.actualDate === key)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, "MMM dd"),
        amount,
      };
    });
  }, [transactions]);

  const pieData = useMemo(
    () =>
      categorySpends.map(c => ({
        name: c.categoryName,
        value: c.amount,
        color: c.color,
      })),
    [categorySpends]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Daily Expenses (Current Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyExpenses}>
                <defs>
                  <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={value => formatIDR(value)}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  formatter={(value: number) => formatIDR(value)}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#fillExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Expense by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: number) => formatIDR(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || "hsl(var(--chart-1))"}
                    />
                  ))}
                </Pie>
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
