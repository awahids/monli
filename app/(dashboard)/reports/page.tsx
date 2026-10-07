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
import { formatMoney, formatMoneyCompact } from '@/lib/currency';
import { ProLock } from '@/components/ui/pro-lock';
import { Download, Filter } from 'lucide-react';
import CategoryMovementChart from '@/components/reports/category-movement-chart';
import { useAppStore } from '@/lib/store';
import { currentBudgetMonth, periodRange } from '@/lib/date';
import { spacePlan } from '@/lib/plans';
import { useT } from '@/lib/i18n';

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
  // dataVersion: reload after a transaction is added (e.g. the + button).
  const { user, space, dataVersion } = useAppStore();
  // Months here are budget months: with a pay-day start (e.g. 26) "Oktober" is 26 Sep – 25 Okt.
  const startDay = user?.budgetStartDay || 1;
  const defaultMonth = currentBudgetMonth(startDay);
  const defaultYear = defaultMonth.slice(0, 4);
  const isPro = spacePlan(user, space) === 'PRO';
  const { t, locale } = useT();
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
  }, [month, dataVersion]);

  useEffect(() => {
    fetch(`/api/reports/income-expense?year=${year}`)
      .then((res) => res.json())
      .then((res) => setTrend(res.data || []))
      .catch(() => setTrend([]));
  }, [year, dataVersion]);

  useEffect(() => {
    if (!isPro) {
      setCategoryData([]);
      return;
    }
    fetch(`/api/reports/category?month=${month}`)
      .then((res) => res.json())
      .then((res) => setCategoryData(res.data || []))
      .catch(() => setCategoryData([]));
  }, [month, isPro, dataVersion]);

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
    <div className="space-y-6">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('Laporan', 'Reports')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('Tren, kategori, dan budget vs realisasi.', 'Trends, categories and budget vs actual.')}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full"
            >
              <Filter className="h-4 w-4" /> {t('Filter', 'Filter')}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-4 grid gap-4 grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">{startDay > 1 ? t('Periode (bulan budget)', 'Period (budget month)') : t('Bulan', 'Month')}</label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              {periodRange(month, startDay, locale) && (
                <p className="text-xs text-muted-foreground">{periodRange(month, startDay, locale)}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Tahun', 'Year')}</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ProLock
        locked={!isPro}
        title={t('Laporan lengkap ada di PRO', 'Full reports are in PRO')}
        description={t('Tren tahunan, rincian kategori, budget vs realisasi, dan export CSV.', 'Yearly trends, category breakdown, budget vs actual and CSV export.')}
      >
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-4">
          <TabsTrigger
            value="summary"
            className="w-full px-1 text-xs"
          >
            {t('Ringkasan', 'Summary')}
          </TabsTrigger>
          <TabsTrigger
            value="trend"
            className="w-full px-1 text-xs"
          >
            {t('Tren', 'Trend')}
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="w-full px-1 text-xs"
          >
            {t('Kategori', 'Category')}
          </TabsTrigger>
          <TabsTrigger
            value="movement"
            className="w-full px-1 text-xs"
          >
            Budget
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full"
              onClick={exportDailyCSV}
            >
              <Download className="h-4 w-4" /> {t('Export CSV', 'Export CSV')}
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Pengeluaran harian', 'Daily spending')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
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
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--chart-1))"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis width={56} tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoneyCompact(v)} />
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#sumColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('Pengeluaran per kategori', 'Spending by category')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
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
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full"
              onClick={exportTrendCSV}
            >
              <Download className="h-4 w-4" /> {t('Export CSV', 'Export CSV')}
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Pemasukan vs pengeluaran', 'Income vs expenses')} ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis width={56} tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoneyCompact(v)} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name={t('Pemasukan', 'Income')} stroke="#16a34a" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" name={t('Pengeluaran', 'Expenses')} stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 w-full"
              onClick={exportCategoryCSV}
            >
              <Download className="h-4 w-4" /> {t('Export CSV', 'Export CSV')}
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('Rincian kategori', 'Category breakdown')} ({month})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
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
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
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
      </ProLock>
    </div>
  );
}
