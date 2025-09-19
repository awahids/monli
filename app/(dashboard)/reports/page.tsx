'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatIDR } from '@/lib/currency';
import { Download, Filter } from 'lucide-react';
import CategoryMovementChart from '@/components/reports/category-movement-chart';
import { useAppStore } from '@/lib/store';

interface TrendRow {
  month: string;
  income: number;
  expense: number;
}

interface CategoryRow {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
}

interface SummaryResponse {
  daily: { date: string; amount: number }[];
  categories: CategoryRow[];
}

export default function ReportsPage() {
  const now = new Date();
  const defaultMonth = now.toISOString().slice(0, 7);
  const defaultYear = String(now.getUTCFullYear());

  const { user } = useAppStore();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [summary, setSummary] = useState<SummaryResponse>({
    daily: [],
    categories: [],
  });
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryRow[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?month=${month}`)
      .then((res) => res.json())
      .then((data) =>
        setSummary({
          daily: data.daily || [],
          categories: data.categories || [],
        })
      )
      .catch(() => setSummary({ daily: [], categories: [] }));
  }, [month]);

  useEffect(() => {
    fetch(`/api/reports/income-expense?year=${year}`)
      .then((res) => res.json())
      .then((res) => setTrend(res.data || []))
      .catch(() => setTrend([]));
  }, [year]);

  useEffect(() => {
    if (user?.plan !== "PRO") {
      setCategoryData([]);
      return;
    }
    fetch(`/api/reports/category?month=${month}`)
      .then((res) => res.json())
      .then((res) => setCategoryData(res.data || []))
      .catch(() => setCategoryData([]));
  }, [month, user]);

  if (user?.plan !== "PRO") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold">Reports are a Pro feature</h2>
        <p className="text-muted-foreground">
          Upgrade to access detailed financial reports and insights.
        </p>
        <Button asChild size="lg" className="mt-2 w-full sm:w-auto shadow-lg">
          <Link href="/upgrade">Upgrade to Pro</Link>
        </Button>
      </div>
    );
  }

  const exportCSV = (
    rows: Record<string, unknown>[],
    filename: string,
    keys?: string[]
  ) => {
    if (!rows.length) return;
    const cols = keys ?? Object.keys(rows[0]);
    const escape = (value: unknown) => {
      const str = String(value ?? '');
      return /[",\n]/.test(str)
        ? '"' + str.replace(/"/g, '""') + '"'
        : str;
    };
    const header = cols.join(',');
    const lines = rows.map((r) =>
      cols.map((k) => escape((r as Record<string, unknown>)[k])).join(',')
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dailyData = summary.daily.map((d) => ({
    date: d.date.slice(8, 10),
    amount: d.amount,
  }));

  const exportDailyCSV = () => {
    let running = 0;
    const rows = summary.daily.map((d) => {
      running += d.amount;
      return {
        date: d.date,
        day: d.date.slice(8, 10),
        amount: d.amount,
        cumulative: running,
      };
    });
    exportCSV(rows, `daily-${month}.csv`, [
      'date',
      'day',
      'amount',
      'cumulative',
    ]);
  };

  const exportTrendCSV = () => {
    const rows = trend.map((t) => ({
      month: t.month,
      income: t.income,
      expense: t.expense,
      balance: t.income - t.expense,
    }));
    exportCSV(rows, `trend-${year}.csv`, [
      'month',
      'income',
      'expense',
      'balance',
    ]);
  };

  const exportCategoryCSV = () => {
    const total = categoryData.reduce((sum, c) => sum + c.amount, 0);
    const rows = categoryData.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      amount: c.amount,
      percentage: total ? Number(((c.amount / total) * 100).toFixed(2)) : 0,
      color: c.color,
    }));
    exportCSV(rows, `categories-${month}.csv`, [
      'categoryId',
      'name',
      'amount',
      'percentage',
      'color',
    ]);
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Reports
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Analyze your finances
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:flex sm:h-10 sm:overflow-visible">
          <TabsTrigger
            value="summary"
            className="w-full whitespace-nowrap sm:flex-1"
          >
            Monthly Summary
          </TabsTrigger>
          <TabsTrigger
            value="trend"
            className="w-full whitespace-nowrap sm:flex-1"
          >
            Income vs Expense Trend
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="w-full whitespace-nowrap sm:flex-1"
          >
            Category Details
          </TabsTrigger>
          <TabsTrigger
            value="movement"
            className="w-full whitespace-nowrap sm:flex-1"
          >
            Budget vs Actual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="flex justify-start sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full sm:w-auto"
              onClick={exportDailyCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient
                          id="sumColor"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => formatIDR(v)} />
                      <Tooltip formatter={(v: number) => formatIDR(v)} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#3B82F6"
                        fill="url(#sumColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categories}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        // Responsive radius
                        // outerRadius={window.innerWidth < 640 ? 80 : 100}
                        // innerRadius={window.innerWidth < 640 ? 45 : 60}
                      >
                        {summary.categories.map((entry) => (
                          <Cell key={entry.categoryId} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatIDR(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <div className="flex justify-start sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full sm:w-auto"
              onClick={exportTrendCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expense ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => formatIDR(v)} />
                    <Tooltip formatter={(v: number) => formatIDR(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#16a34a" />
                    <Line type="monotone" dataKey="expense" stroke="#dc2626" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="flex justify-start sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full sm:w-auto"
              onClick={exportCategoryCSV}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Category Details ({month})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatIDR(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="space-y-4">
          <CategoryMovementChart month={month} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
