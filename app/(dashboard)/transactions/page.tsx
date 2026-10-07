'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import Link from 'next/link';
import { Camera, ReceiptText, Repeat, Search, SearchX, SlidersHorizontal, Split, X } from 'lucide-react';
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
import OcrReviewDialog from '@/components/transactions/ocr-review-dialog';
import { shrinkImage, type OcrItem } from '@/lib/ocr';
import { uploadReceipt } from '@/lib/receipts';
import { SplitBillDialog } from '@/components/transactions/split-bill-dialog';
import { currentBudgetMonth, formatDate, periodRange, shiftMonth } from '@/lib/date';
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
import { type I18n, useT } from '@/lib/i18n';

const PAGE_SIZE = 30;

type Preset = 'this-month' | 'last-month' | '30d' | 'all' | 'custom';
const PRESETS: { value: Exclude<Preset, 'custom'>; label: [string, string] }[] = [
  { value: 'this-month', label: ['Bulan ini', 'This month'] },
  { value: 'last-month', label: ['Bulan lalu', 'Last month'] },
  { value: '30d', label: ['30 hari', '30 days'] },
  { value: 'all', label: ['Semua', 'All'] },
];
const TYPE_LABELS: Record<string, [string, string]> = {
  expense: ['Pengeluaran', 'Expense'],
  income: ['Pemasukan', 'Income'],
  transfer: ['Transfer', 'Transfer'],
};

/** The budget month for "Bulan/Periode ini" and "… lalu"; these follow the pay-day period. */
function presetPeriod(preset: Preset, startDay: number): string | undefined {
  const month = currentBudgetMonth(startDay);
  if (preset === 'this-month') return month;
  if (preset === 'last-month') return shiftMonth(month, -1);
  return undefined;
}

/** Inclusive YYYY-MM-DD bounds for the date-based presets (actual-date filtering). */
function presetRange(preset: Preset, custom: DateRange): { from?: string; to?: string } {
  switch (preset) {
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

function dayLabel(date: string, { t, dateLocale }: I18n): string {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (date === today) return t('Hari ini', 'Today');
  if (date === yesterday) return t('Kemarin', 'Yesterday');
  return format(new Date(`${date}T00:00:00`), 'EEEE, d MMM yyyy', { locale: dateLocale });
}

function ListSkeleton() {
  const { t } = useT();
  return (
    <div className="space-y-3" aria-busy="true" aria-label={t('Memuat transaksi', 'Loading transactions')}>
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
    space,
    accounts,
    categories,
    transactions,
    setAccounts,
    setCategories,
    setTransactions,
    dataVersion,
  } = useAppStore();
  const searchParams = useSearchParams();
  const { isOnline, addOfflineChange } = useOffline();
  const i18n = useT();
  const { t, dateLocale, locale } = i18n;

  // Filters
  // Opened from the header's search button: search all time.
  const [preset, setPreset] = useState<Preset>(searchParams.has('search') ? 'all' : 'this-month');
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [accountFilter, setAccountFilter] = useState(searchParams.get('accountId') ?? 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateField, setDateField] = useState<'actual' | 'budget'>('actual');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
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
  const [splitOpen, setSplitOpen] = useState(false);
  // The scanned photo, stored with the transactions saved from it (path set
  // once uploaded, so a retry after a partial save reuses it).
  const receiptRef = useRef<{ image: Blob; path?: string } | null>(null);

  // Follow ?accountId= when navigating here from an account card.
  useEffect(() => {
    setAccountFilter(searchParams.get('accountId') ?? 'all');
  }, [searchParams]);

  const range = useMemo(() => presetRange(preset, customRange), [preset, customRange]);
  const startDay = user?.budgetStartDay || 1;
  const period = presetPeriod(preset, startDay);
  const unit = startDay > 1 ? 'Periode' : 'Bulan';
  const unitEn = startDay > 1 ? 'period' : 'month';

  const buildParams = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams({
        page: String(pageNumber),
        pageSize: String(PAGE_SIZE),
        dateField,
      });
      if (range.from) params.set('from', dateField === 'budget' ? range.from.slice(0, 7) : range.from);
      if (range.to) params.set('to', dateField === 'budget' ? range.to.slice(0, 7) : range.to);
      if (period) params.set('period', period);
      if (accountFilter !== 'all') params.set('accountId', accountFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (pageNumber === 1) params.set('summary', '1');
      return params;
    },
    [range, period, dateField, accountFilter, categoryFilter, typeFilter, debouncedSearch]
  );

  /** Loads page 1 (replacing the list) or appends the next page. */
  const fetchTransactions = useCallback(
    async (pageNumber = 1) => {
      if (!user) return;
      // Offline: show the last list kept on this device (see useOffline).
      if (!isOnline) {
        setLoading(false);
        return;
      }
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
          toast.error(data.error || t('Gagal memuat transaksi', 'Could not load transactions'));
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
    [user, isOnline, buildParams, setTransactions, t]
  );

  // dataVersion: reload after a change made anywhere (e.g. the + button).
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions, dataVersion]);

  useEffect(() => {
    if (!user || !isOnline) return;
    (async () => {
      if (!accounts.length) {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', (space?.ownerId ?? user.id))
          .eq('archived', false);
        if (data) setAccounts(keysToCamel<Account[]>(data));
      }
      if (!categories.length) {
        const { data } = await supabase.from('categories').select('*').eq('user_id', (space?.ownerId ?? user.id));
        if (data) setCategories(keysToCamel<Category[]>(data));
      }
    })().catch(console.error);
  }, [space?.ownerId, user, isOnline, accounts.length, categories.length, setAccounts, setCategories]);

  const refreshAccounts = useCallback(async () => {
    if (!user || !isOnline) return;
    await refreshActiveAccounts((space?.ownerId ?? user.id));
  }, [space?.ownerId, user, isOnline]);

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
    receiptRef.current = null;
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
            tx.id === editing!.id ? { ...tx, ...toOfflineTransaction(payload, (space?.ownerId ?? user.id)), id: tx.id } : tx
          )
        );
        await addOfflineChange('update', 'transactions', { id: editing!.id, ...payload });
      } else {
        setTransactions([toOfflineTransaction(payload, (space?.ownerId ?? user.id)), ...transactions]);
        await addOfflineChange('create', 'transactions', payload);
      }
      toast.success(t('Disimpan offline, akan disinkronkan saat online', 'Saved offline, will sync when online'));
      closeForm();
      return;
    }

    // Saving bumps dataVersion, which reloads the list and totals.
    const receiptPath = isEditing ? undefined : await storeReceipt();
    await saveTransaction({ ...payload, ...(receiptPath && { receiptPath }) }, editing?.id);
    toast.success(isEditing ? t('Transaksi diperbarui', 'Transaction updated') : t('Transaksi tersimpan', 'Transaction saved'));
    closeForm();
    await refreshAccounts();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (!isOnline) {
      await addOfflineChange('delete', 'transactions', { id: pendingDelete.id });
      setTransactions(transactions.filter((t) => t.id !== pendingDelete.id));
      if (editing?.id === pendingDelete.id) closeForm();
      setPendingDelete(null);
      toast.success(t('Dihapus offline, akan disinkronkan saat online', 'Deleted offline, will sync when online'));
      return;
    }
    try {
      await deleteTransaction(pendingDelete.id);
      toast.success(t('Transaksi dihapus', 'Transaction deleted'));
      if (editing?.id === pendingDelete.id) closeForm();
      setPendingDelete(null);
      await refreshAccounts();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  /** Uploads the scanned photo once; a failed upload never blocks saving. */
  const storeReceipt = async (): Promise<string | undefined> => {
    const receipt = receiptRef.current;
    if (!receipt || !user) return undefined;
    try {
      receipt.path ??= await uploadReceipt(space?.ownerId ?? user.id, receipt.image);
      return receipt.path;
    } catch (e) {
      toast.warning(`${(e as Error).message}; transaksi tetap disimpan`);
      return undefined;
    }
  };

  const handleOcrFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const image = await shrinkImage(file);
      receiptRef.current = { image };
      const formData = new FormData();
      formData.append('file', image, 'scan.jpg');
      const res = await fetch('/api/transactions/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        receiptRef.current = null;
        toast.error(data.error || t('Gagal membaca struk', 'Could not read the receipt'));
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
      receiptRef.current = null;
      toast.error(t('Gagal membaca struk', 'Could not read the receipt'));
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const handleOcrSave = async (items: TransactionFormValues[]) => {
    let saved = 0;
    try {
      // One photo for every row of the receipt.
      const receiptPath = await storeReceipt();
      for (const values of items) {
        await saveTransaction({ ...toTransactionPayload(values), ...(receiptPath && { receiptPath }) });
        saved += 1;
      }
      toast.success(t(`${saved} transaksi tersimpan`, `${saved} transactions saved`));
      receiptRef.current = null;
      setOcrOpen(false);
    } catch (e) {
      // Drop the rows that were already saved so a retry does not duplicate them.
      setOcrItems((prev) => prev.slice(saved));
      toast.error(
        `${(e as Error).message}${saved ? t(` (${saved} dari ${items.length} sudah tersimpan)`, ` (${saved} of ${items.length} already saved)`) : ''}`
      );
    } finally {
      await refreshAccounts();
    }
  };

  const openNew = () => {
    receiptRef.current = null;
    setEditing(undefined);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const activeFilters = [
    accountFilter !== 'all' && {
      key: 'account',
      label: accounts.find((a) => a.id === accountFilter)?.name ?? t('Akun', 'Account'),
      clear: () => setAccountFilter('all'),
    },
    categoryFilter !== 'all' && {
      key: 'category',
      label: categories.find((c) => c.id === categoryFilter)?.name ?? t('Kategori', 'Category'),
      clear: () => setCategoryFilter('all'),
    },
    typeFilter !== 'all' && {
      key: 'type',
      label: t(...TYPE_LABELS[typeFilter]),
      clear: () => setTypeFilter('all'),
    },
    dateField === 'budget' && {
      key: 'field',
      label: t('Per bulan budget', 'By budget month'),
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
      ? `${format(customRange.from, 'd MMM', { locale: dateLocale })}${
          customRange.to ? ` – ${format(customRange.to, 'd MMM', { locale: dateLocale })}` : ''
        }`
      : t('Pilih tanggal', 'Pick dates');

  return (
    <div className="space-y-4">
      <OcrReviewDialog
        open={ocrOpen}
        onOpenChange={(o) => {
          if (!o) receiptRef.current = null;
          setOcrOpen(o);
        }}
        items={ocrItems}
        accounts={accounts}
        categories={categories}
        date={ocrDate}
        onSave={handleOcrSave}
      />
      <SplitBillDialog open={splitOpen} onOpenChange={setSplitOpen} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOcrFile}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Transaksi', 'Transactions')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('Semua pemasukan, pengeluaran, dan transfer.', 'All income, expenses and transfers.')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setSplitOpen(true)} aria-label={t('Bagi tagihan', 'Split bill')}>
            <Split className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" asChild aria-label={t('Transaksi rutin', 'Recurring transactions')}>
            <Link href="/recurring">
              <Repeat className="h-4 w-4" />
            </Link>
          </Button>
          {user?.plan === 'PRO' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              aria-label={t('Scan struk', 'Scan receipt')}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Cari catatan, tag, kategori, nominal', 'Search notes, tags, categories, amounts')}
            className="pl-9"
            value={search}
            onChange={(e) => {
              // A new search looks through all time; the chips can narrow it again.
              if (!search && e.target.value) setPreset('all');
              setSearch(e.target.value);
            }}
            autoFocus={searchParams.has('search')}
            aria-label={t('Cari transaksi', 'Search transactions')}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)} className="relative shrink-0" aria-label={t('Filter', 'Filters')}>
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </div>

      {/* Period presets + active filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
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
            {p.value === 'this-month'
              ? t(`${unit} ini`, `This ${unitEn}`)
              : p.value === 'last-month'
                ? t(`${unit} lalu`, `Last ${unitEn}`)
                : t(...p.label)}
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
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>
        {activeFilters.map((f) => (
          <span
            key={f.key}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground"
          >
            {f.label}
            <button type="button" onClick={f.clear} aria-label={t(`Hapus filter ${f.label}`, `Remove filter ${f.label}`)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Totals for the current view */}
      {period && periodRange(period, startDay) && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {t('Periode', 'Period')} {periodRange(period, startDay, locale)}
        </p>
      )}

      {summary && !loading && total > 0 && (
        <Card className="grid grid-cols-3 divide-x p-0 text-center">
          <div className="p-3">
            <p className="text-xs text-muted-foreground">{t('Pemasukan', 'Income')}</p>
            <p className="truncate text-sm font-semibold text-green-600 dark:text-green-400">
              {formatMoney(summary.income)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground">{t('Pengeluaran', 'Expenses')}</p>
            <p className="truncate text-sm font-semibold">{formatMoney(summary.expense)}</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground">{t('Selisih', 'Net')}</p>
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
            title={t(`Belum ada transaksi ${unit.toLowerCase()} ini`, `No transactions this ${unitEn}`)}
            description={t('Catat pengeluaran atau pemasukan, atau lihat periode sebelumnya.', 'Record an expense or income, or look at earlier periods.')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={openNew}>{t('Catat transaksi', 'Add transaction')}</Button>
                <Button variant="outline" onClick={() => setPreset('all')}>
                  {t('Lihat semua periode', 'See all periods')}
                </Button>
              </div>
            }
          />
        ) : hasNarrowing ? (
          <EmptyState
            icon={SearchX}
            title={t('Tidak ada transaksi yang cocok', 'No matching transactions')}
            description={t('Coba ganti periode atau hapus filter.', 'Try another period or clear the filters.')}
            action={
              <Button variant="outline" onClick={clearAll}>
                {t('Hapus semua filter', 'Clear all filters')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ReceiptText}
            title={t('Belum ada transaksi', 'No transactions yet')}
            description={t('Catat pengeluaran atau pemasukan pertamamu.', 'Record your first expense or income.')}
            action={<Button onClick={openNew}>{t('Catat transaksi', 'Add transaction')}</Button>}
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
                      ? `Budget ${format(new Date(`${key}-01T00:00:00`), 'MMMM yyyy', { locale: dateLocale })}`
                      : dayLabel(key, i18n)}
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
                {loadingMore ? t('Memuat...', 'Loading...') : t('Muat lebih banyak', 'Load more')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t(`${transactions.length} dari ${total} transaksi`, `${transactions.length} of ${total} transactions`)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{t('Filter transaksi', 'Filter transactions')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Akun', 'Account')}</Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Semua akun', 'All accounts')}</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Kategori', 'Category')}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Semua kategori', 'All categories')}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Jenis', 'Type')}</Label>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1 text-sm">
                {[['all', t('Semua', 'All')] as const, ...Object.entries(TYPE_LABELS).map(([v, l]) => [v, t(...l)] as const)].map(([value, label]) => (
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
              <Label>{t('Periode dihitung dari', 'Period based on')}</Label>
              <Select value={dateField} onValueChange={(v) => setDateField(v as 'actual' | 'budget')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">{t('Tanggal transaksi', 'Transaction date')}</SelectItem>
                  <SelectItem value="budget">{t('Bulan budget', 'Budget month')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t(
                  '"Bulan budget" mengelompokkan transaksi sesuai budget bulan yang dipilih saat mencatat.',
                  '"Budget month" groups transactions by the budget month chosen when recording.'
                )}
              </p>
            </div>
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={clearAll}>
              {t('Reset', 'Reset')}
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {t('Tampilkan', 'Show')}
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
        title={t('Hapus transaksi?', 'Delete transaction?')}
        description={
          pendingDelete
            ? t(
                `${pendingDelete.note || pendingDelete.category?.name || 'Transaksi ini'} (${formatMoney(pendingDelete.amount)}) akan dihapus dan saldo akun diperbarui. Tindakan ini tidak bisa dibatalkan.`,
                `${pendingDelete.note || pendingDelete.category?.name || 'This transaction'} (${formatMoney(pendingDelete.amount)}) will be deleted and account balances updated. This cannot be undone.`
              )
            : undefined
        }
        confirmLabel={t('Hapus', 'Delete')}
        cancelLabel={t('Batal', 'Cancel')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
