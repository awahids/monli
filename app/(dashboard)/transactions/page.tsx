'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import Link from 'next/link';
import { Camera, Plus, ReceiptText, Repeat, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { runDueRecurring } from '@/lib/recurring-client';
import { defaultBudgetMonth } from '@/lib/budget-period';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Transaction, Account, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import TransactionForm, {
  TransactionFormValues,
} from '@/components/transactions/transaction-form';
import { TransactionRow } from '@/components/transactions/transaction-row';
import OcrReviewDialog, { OcrItem } from '@/components/transactions/ocr-review-dialog';
import { currentMonth, formatDate, nextMonthStart, shiftMonth } from '@/lib/date';
import { keysToCamel } from '@/lib/case';
import {
  deleteTransaction,
  refreshActiveAccounts,
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from '@/lib/transactions-client';
import { useDebounce } from '@/hooks/use-debounce';
import { useOffline } from '@/hooks/use-offline';

const PAGE_SIZE = 30;

type Preset = 'this-month' | 'last-month' | '30d' | 'all' | 'custom';
const PRESETS: { value: Exclude<Preset, 'custom'>; label: string }[] = [
  { value: 'this-month', label: 'Bulan ini' },
  { value: 'last-month', label: 'Bulan lalu' },
  { value: '30d', label: '30 hari' },
  { value: 'all', label: 'Semua' },
];
const TYPE_LABELS: Record<string, string> = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  transfer: 'Transfer',
};

/** Inclusive YYYY-MM-DD bounds for a preset (actual-date filtering). */
function presetRange(preset: Preset, custom: DateRange): { from?: string; to?: string } {
  const month = currentMonth();
  const dayBefore = (d: string) =>
    formatDate(new Date(new Date(`${d}T00:00:00+07:00`).getTime() - 86400000));
  switch (preset) {
    case 'this-month':
      return { from: `${month}-01`, to: dayBefore(nextMonthStart(month)) };
    case 'last-month': {
      const prev = shiftMonth(month, -1);
      return { from: `${prev}-01`, to: dayBefore(`${month}-01`) };
    }
    case '30d':
      return { from: formatDate(new Date(Date.now() - 29 * 86400000)), to: formatDate(new Date()) };
    case 'custom':
      return {
        from: custom.from ? formatDate(custom.from) : undefined,
        to: custom.to ? formatDate(custom.to) : custom.from ? formatDate(custom.from) : undefined,
      };
    default:
      return {};
  }
}

function dayLabel(date: string): string {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (date === today) return 'Hari ini';
  if (date === yesterday) return 'Kemarin';
  return format(new Date(`${date}T00:00:00`), 'EEEE, d MMM yyyy', { locale: localeId });
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat transaksi">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const {
    user,
    accounts,
    categories,
    transactions,
    setAccounts,
    setCategories,
    setTransactions,
  } = useAppStore();
  const searchParams = useSearchParams();
  const { isOnline, addOfflineChange } = useOffline();

  // Filters
  const [preset, setPreset] = useState<Preset>('this-month');
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [accountFilter, setAccountFilter] = useState(searchParams.get('accountId') ?? 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateField, setDateField] = useState<'actual' | 'budget'>('actual');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{ income: number; expense: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [initialValues, setInitialValues] = useState<Partial<TransactionFormValues>>();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrItems, setOcrItems] = useState<OcrItem[]>([]);
  const [ocrDate, setOcrDate] = useState<Date>(new Date());
  const [scanning, setScanning] = useState(false);

  // Follow ?accountId= when navigating here from an account card.
  useEffect(() => {
    setAccountFilter(searchParams.get('accountId') ?? 'all');
  }, [searchParams]);

  const range = useMemo(() => presetRange(preset, customRange), [preset, customRange]);

  const buildParams = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams({
        page: String(pageNumber),
        pageSize: String(PAGE_SIZE),
        dateField,
      });
      if (range.from) params.set('from', dateField === 'budget' ? range.from.slice(0, 7) : range.from);
      if (range.to) params.set('to', dateField === 'budget' ? range.to.slice(0, 7) : range.to);
      if (accountFilter !== 'all') params.set('accountId', accountFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (pageNumber === 1) params.set('summary', '1');
      return params;
    },
    [range, dateField, accountFilter, categoryFilter, typeFilter, debouncedSearch]
  );

  /** Loads page 1 (replacing the list) or appends the next page. */
  const fetchTransactions = useCallback(
    async (pageNumber = 1) => {
      if (!user || !isOnline) return;
      const requestId = ++requestIdRef.current;
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        if (pageNumber === 1) await runDueRecurring();
        const res = await fetch(`/api/transactions?${buildParams(pageNumber).toString()}`);
        const data = await res.json();
        // Ignore responses that arrive after a newer request was sent.
        if (requestId !== requestIdRef.current) return;
        if (!res.ok) {
          toast.error(data.error || 'Gagal memuat transaksi');
          return;
        }
        const rows = keysToCamel<Transaction[]>(data.rows);
        const current = useAppStore.getState().transactions;
        setTransactions(pageNumber === 1 ? rows : [...current, ...rows]);
        setTotal(data.total);
        setPage(pageNumber);
        if (data.summary) setSummary(data.summary);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [user, isOnline, buildParams, setTransactions]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    if (!user || !isOnline) return;
    (async () => {
      if (!accounts.length) {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false);
        if (data) setAccounts(keysToCamel<Account[]>(data));
      }
      if (!categories.length) {
        const { data } = await supabase.from('categories').select('*').eq('user_id', user.id);
        if (data) setCategories(keysToCamel<Category[]>(data));
      }
    })().catch(console.error);
  }, [user, isOnline, accounts.length, categories.length, setAccounts, setCategories]);

  const refreshAccounts = useCallback(async () => {
    if (!user || !isOnline) return;
    await refreshActiveAccounts(user.id);
  }, [user, isOnline]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = dateField === 'budget' ? t.budgetMonth : t.actualDate;
      if (!key) return;
      map.set(key, [...(map.get(key) ?? []), t]);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions, dateField]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(undefined);
    setInitialValues(undefined);
  };

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSave = async (values: TransactionFormValues) => {
    if (!user) return;
    const payload = toTransactionPayload(values);
    const isEditing = Boolean(editing);

    if (!isOnline) {
      if (isEditing) {
        setTransactions(
          transactions.map((tx) =>
            tx.id === editing!.id ? { ...tx, ...toOfflineTransaction(payload, user.id), id: tx.id } : tx
          )
        );
        await addOfflineChange('update', 'transactions', { id: editing!.id, ...payload });
      } else {
        setTransactions([toOfflineTransaction(payload, user.id), ...transactions]);
        await addOfflineChange('create', 'transactions', payload);
      }
      toast.success('Disimpan offline, akan disinkronkan saat online');
      closeForm();
      return;
    }

    await saveTransaction(payload, editing?.id);
    toast.success(isEditing ? 'Transaksi diperbarui' : 'Transaksi tersimpan');
    closeForm();
    await fetchTransactions(1);
    await refreshAccounts();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTransaction(pendingDelete.id);
      toast.success('Transaksi dihapus');
      if (editing?.id === pendingDelete.id) closeForm();
      setPendingDelete(null);
      await fetchTransactions(1);
      await refreshAccounts();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleOcrFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/transactions/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal membaca struk');
        return;
      }
      const date = data.date ? new Date(`${data.date}T00:00:00+07:00`) : new Date();
      setOcrDate(date);
      if (Array.isArray(data.items) && data.items.length) {
        setOcrItems(data.items as OcrItem[]);
        setOcrOpen(true);
      } else {
        setInitialValues({
          amount: data.total || data.amount,
          note: data.description,
          actualDate: date,
          budgetMonth: defaultBudgetMonth(date),
          type: 'expense',
        });
        setEditing(undefined);
        setFormOpen(true);
      }
    } catch {
      toast.error('Gagal membaca struk');
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleOcrSave = async (items: TransactionFormValues[]) => {
    let saved = 0;
    try {
      for (const values of items) {
        await saveTransaction(toTransactionPayload(values));
        saved += 1;
      }
      toast.success(`${saved} transaksi tersimpan`);
      setOcrOpen(false);
    } catch (e) {
      // Drop the rows that were already saved so a retry does not duplicate them.
      setOcrItems((prev) => prev.slice(saved));
      toast.error(
        `${(e as Error).message}${saved ? ` (${saved} dari ${items.length} sudah tersimpan)` : ''}`
      );
    } finally {
      await fetchTransactions(1);
      await refreshAccounts();
    }
  };

  const openNew = () => {
    setEditing(undefined);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const activeFilters = [
    accountFilter !== 'all' && {
      key: 'account',
      label: accounts.find((a) => a.id === accountFilter)?.name ?? 'Akun',
      clear: () => setAccountFilter('all'),
    },
    categoryFilter !== 'all' && {
      key: 'category',
      label: categories.find((c) => c.id === categoryFilter)?.name ?? 'Kategori',
      clear: () => setCategoryFilter('all'),
    },
    typeFilter !== 'all' && {
      key: 'type',
      label: TYPE_LABELS[typeFilter],
      clear: () => setTypeFilter('all'),
    },
    dateField === 'budget' && {
      key: 'field',
      label: 'Per bulan budget',
      clear: () => setDateField('actual'),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];
  const hasNarrowing = activeFilters.length > 0 || Boolean(debouncedSearch) || preset !== 'all';
  const clearAll = () => {
    setAccountFilter('all');
    setCategoryFilter('all');
    setTypeFilter('all');
    setDateField('actual');
    setSearch('');
    setPreset('all');
  };

  const customLabel =
    preset === 'custom' && customRange.from
      ? `${format(customRange.from, 'd MMM', { locale: localeId })}${
          customRange.to ? ` – ${format(customRange.to, 'd MMM', { locale: localeId })}` : ''
        }`
      : 'Pilih tanggal';

  return (
    <div className="space-y-4">
      <OcrReviewDialog
        open={ocrOpen}
        onOpenChange={setOcrOpen}
        items={ocrItems}
        accounts={accounts}
        categories={categories}
        date={ocrDate}
        onSave={handleOcrSave}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleOcrFile}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transaksi</h1>
          <p className="text-sm text-muted-foreground">Semua pemasukan, pengeluaran, dan transfer.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild aria-label="Transaksi rutin">
            <Link href="/recurring">
              <Repeat className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Rutin</span>
            </Link>
          </Button>
          {user?.plan === 'PRO' && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              aria-label="Scan struk"
            >
              <Camera className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{scanning ? 'Membaca...' : 'Scan struk'}</span>
            </Button>
          )}
          {/* On mobile the bottom nav already has the add button. */}
          <Button onClick={openNew} className="hidden md:inline-flex">
            <Plus className="mr-2 h-4 w-4" /> Catat transaksi
          </Button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari catatan atau tag"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari transaksi"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(true)} className="relative">
          <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Filter</span>
          {activeFilters.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {/* Period presets + active filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={preset === p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
              preset === p.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            {p.label}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                preset === 'custom' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {customLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={(r) => {
                setCustomRange(r ?? { from: undefined, to: undefined });
                setPreset(r?.from ? 'custom' : 'all');
              }}
              numberOfMonths={1}
              locale={localeId}
            />
          </PopoverContent>
        </Popover>
        {activeFilters.map((f) => (
          <span
            key={f.key}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground"
          >
            {f.label}
            <button type="button" onClick={f.clear} aria-label={`Hapus filter ${f.label}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Totals for the current view */}
      {summary && !loading && total > 0 && (
        <Card className="grid grid-cols-3 divide-x p-0 text-center">
          <div className="p-3">
            <p className="text-xs text-muted-foreground">Pemasukan</p>
            <p className="truncate text-sm font-semibold text-green-600 dark:text-green-400">
              {formatMoney(summary.income)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground">Pengeluaran</p>
            <p className="truncate text-sm font-semibold">{formatMoney(summary.expense)}</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground">Selisih</p>
            <p
              className={cn(
                'truncate text-sm font-semibold',
                summary.income - summary.expense >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatMoney(summary.income - summary.expense)}
            </p>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <ListSkeleton />
      ) : transactions.length === 0 ? (
        preset === 'this-month' && activeFilters.length === 0 && !debouncedSearch ? (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada transaksi bulan ini"
            description="Catat pengeluaran atau pemasukan, atau lihat periode sebelumnya."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={openNew}>Catat transaksi</Button>
                <Button variant="outline" onClick={() => setPreset('all')}>
                  Lihat semua periode
                </Button>
              </div>
            }
          />
        ) : hasNarrowing ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada transaksi yang cocok"
            description="Coba ganti periode atau hapus filter."
            action={
              <Button variant="outline" onClick={clearAll}>
                Hapus semua filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ReceiptText}
            title="Belum ada transaksi"
            description="Catat pengeluaran atau pemasukan pertamamu."
            action={<Button onClick={openNew}>Catat transaksi</Button>}
          />
        )
      ) : (
        <div className="space-y-4">
          {groups.map(([key, txs]) => {
            const net = txs.reduce(
              (sum, t) => sum + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0),
              0
            );
            return (
              <section key={key}>
                <div className="flex items-baseline justify-between px-2 pb-1">
                  <h2 className="font-sans text-sm font-semibold capitalize text-muted-foreground">
                    {dateField === 'budget'
                      ? `Budget ${format(new Date(`${key}-01T00:00:00`), 'MMMM yyyy', { locale: localeId })}`
                      : dayLabel(key)}
                  </h2>
                  {net !== 0 && (
                    <span
                      className={cn(
                        'text-xs font-medium tabular-nums',
                        net > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}
                    >
                      {net > 0 ? '+' : ''}
                      {formatMoney(net)}
                    </span>
                  )}
                </div>
                <Card className="divide-y p-1">
                  {txs.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      showDate={dateField === 'budget'}
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                    />
                  ))}
                </Card>
              </section>
            );
          })}

          {transactions.length < total && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button
                variant="outline"
                onClick={() => fetchTransactions(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {transactions.length} dari {total} transaksi
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl sm:mx-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Filter transaksi</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Akun</Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua akun</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis</Label>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 text-sm">
                {[['all', 'Semua'], ...Object.entries(TYPE_LABELS)].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={typeFilter === value}
                    onClick={() => setTypeFilter(value)}
                    className={cn(
                      'rounded-md py-1.5',
                      typeFilter === value ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Periode dihitung dari</Label>
              <Select value={dateField} onValueChange={(v) => setDateField(v as 'actual' | 'budget')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">Tanggal transaksi</SelectItem>
                  <SelectItem value="budget">Bulan budget</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                &quot;Bulan budget&quot; mengelompokkan transaksi sesuai budget bulan yang dipilih saat mencatat.
              </p>
            </div>
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={clearAll}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Tampilkan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <TransactionForm
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(undefined);
          setFormOpen(o);
        }}
        transaction={editing}
        initialValues={initialValues}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSave}
        onDelete={editing ? async () => setPendingDelete(editing) : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Hapus transaksi?"
        description={
          pendingDelete
            ? `${pendingDelete.note || pendingDelete.category?.name || 'Transaksi ini'} (${formatMoney(pendingDelete.amount)}) akan dihapus dan saldo akun diperbarui. Tindakan ini tidak bisa dibatalkan.`
            : undefined
        }
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
