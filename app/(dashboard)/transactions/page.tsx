'use client';

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Fragment,
  useRef,
  ChangeEvent,
} from 'react';
import { format, parseISO } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { Plus, Pencil, Trash, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { formatIDR } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Transaction, Account, Category } from '@/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange, SelectRangeEventHandler } from 'react-day-picker';
import { Input } from '@/components/ui/input';

import TransactionForm, {
  TransactionFormValues,
} from '@/components/transactions/transaction-form';
import { formatDate } from '@/lib/date';
import { useOffline } from '@/hooks/use-offline';
import OcrReviewDialog, {
  OcrItem,
} from '@/components/transactions/ocr-review-dialog';
import { TransactionFormValues } from '@/components/transactions/transaction-form';

const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as any;
  }
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamel(key)] = keysToCamel(value);
    }
    return result as T;
  }
  return obj as T;
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

  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const handleDateRangeSelect: SelectRangeEventHandler = (range) => {
    setDateRange(range ?? { from: undefined, to: undefined });
    setPage(1);
  };
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [initialValues, setInitialValues] = useState<
    Partial<TransactionFormValues>
  >();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline, addOfflineChange } = useOffline();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [dateField, setDateField] = useState<'actual' | 'budget'>('actual');
  const [groupBy, setGroupBy] = useState<'actual' | 'budget'>('actual');
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrItems, setOcrItems] = useState<OcrItem[]>([]);
  const [ocrDate, setOcrDate] = useState<Date>(new Date());

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
      const key =
        groupBy === 'budget' ? t.budgetMonth : t.actualDate.slice(0, 7);
      (groups[key] = groups[key] || []).push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions, groupBy]);

  const fetchTransactions = useCallback(async () => {
    if (!user || !isOnline) return;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (dateRange.from)
      params.set(
        'from',
        dateField === 'budget'
          ? format(dateRange.from, 'yyyy-MM')
          : formatDate(dateRange.from)
      );
    if (dateRange.to)
      params.set(
        'to',
        dateField === 'budget'
          ? format(dateRange.to, 'yyyy-MM')
          : formatDate(dateRange.to)
      );
    params.set('dateField', dateField);
    if (accountFilter !== 'all') params.set('accountId', accountFilter);
    if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to load transactions');
      return;
    }
    setTransactions(keysToCamel<Transaction[]>(data.rows));
    setTotal(data.total);
  }, [
    user,
    isOnline,
    page,
    pageSize,
    dateRange.from,
    dateRange.to,
    dateField,
    accountFilter,
    categoryFilter,
    typeFilter,
    search,
    setTransactions,
  ]);

  useEffect(() => {
    if (!user || !isOnline) return;

    const fetchData = async () => {
      try {
        if (!accounts.length) {
          const { data: accountsData } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .eq('archived', false);
          if (accountsData) setAccounts(keysToCamel<Account[]>(accountsData));
        }
        if (!categories.length) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
          if (categoriesData)
            setCategories(keysToCamel<Category[]>(categoriesData));
        }
        await fetchTransactions();
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [
    user,
    isOnline,
    accounts.length,
    categories.length,
    setAccounts,
    setCategories,
    fetchTransactions,
  ]);

  const handleSave = async (values: TransactionFormValues) => {
    if (!user) return;
    const payload = {
      budgetMonth: values.budgetMonth,
      actualDate: formatDate(values.actualDate),
      date: formatDate(values.actualDate),
      type: values.type,
      accountId: values.accountId ?? null,
      fromAccountId: values.fromAccountId ?? null,
      toAccountId: values.toAccountId ?? null,
      categoryId: values.categoryId ?? null,
      amount: values.amount,
      note: values.note || '',
      tags: values.tags || [],
    };
    const isEditing = Boolean(editing);

    if (!isOnline) {
      if (isEditing) {
        const updated = transactions.map((tx) =>
          tx.id === editing!.id
            ? {
                ...tx,
                ...payload,
                accountId: payload.accountId ?? undefined,
                fromAccountId: payload.fromAccountId ?? undefined,
                toAccountId: payload.toAccountId ?? undefined,
                categoryId: payload.categoryId ?? undefined,
              }
            : tx,
        );
        setTransactions(updated);
        await addOfflineChange('update', 'transactions', {
          id: editing!.id,
          ...payload,
        });
      } else {
        const tempTx: Transaction = {
          id: `offline-${Date.now()}`,
          userId: user.id,
          budgetMonth: payload.budgetMonth,
          actualDate: payload.actualDate,
          date: payload.date,
          type: payload.type,
          accountId: payload.accountId ?? undefined,
          fromAccountId: payload.fromAccountId ?? undefined,
          toAccountId: payload.toAccountId ?? undefined,
          categoryId: payload.categoryId ?? undefined,
          amount: payload.amount,
          note: payload.note,
          tags: payload.tags,
        };
        setTransactions([tempTx, ...transactions]);
        await addOfflineChange('create', 'transactions', payload);
      }
      toast.success(isEditing ? 'Transaction updated offline' : 'Transaction added offline');
      setFormOpen(false);
      setEditing(undefined);
      setInitialValues(undefined);
      return;
    }

    let res: Response;
    if (isEditing) {
      res = await fetch(`/api/transactions/${editing!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Failed to save transaction');
      return;
    }

    toast.success(isEditing ? 'Transaction updated' : 'Transaction added');
    await fetchTransactions();
    setFormOpen(false);
    setEditing(undefined);
    setInitialValues(undefined);
  };

  const handleDelete = async () => {
    if (!editing) return;
    const res = await fetch(`/api/transactions/${editing.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Failed to delete transaction');
      return;
    }
    toast.success('Transaction deleted');
    await fetchTransactions();
    setFormOpen(false);
    setEditing(undefined);
  };

  const handleDeleteRow = async (t: Transaction) => {
    const res = await fetch(`/api/transactions/${t.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Failed to delete transaction');
      return;
    }
    toast.success('Transaction deleted');
    await fetchTransactions();
  };

  const handleOcrFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/transactions/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to parse receipt');
        return;
      }
      const date = data.date ? new Date(data.date) : new Date();
      setOcrDate(date);
      if (Array.isArray(data.items) && data.items.length) {
        setOcrItems(data.items as OcrItem[]);
        setOcrOpen(true);
      } else {
        setInitialValues({
          amount: data.amount,
          note: data.description,
          actualDate: date,
          budgetMonth: format(date, 'yyyy-MM'),
          type: 'expense',
        });
        setEditing(undefined);
        setFormOpen(true);
      }
    } catch {
      toast.error('Failed to parse receipt');
    } finally {
      e.target.value = '';
    }
  };

  const handleOcrSave = async (items: TransactionFormValues[]) => {
    for (const values of items) {
      const payload = {
        budgetMonth: values.budgetMonth,
        actualDate: formatDate(values.actualDate),
        date: formatDate(values.actualDate),
        type: values.type,
        accountId: values.accountId ?? null,
        fromAccountId: values.fromAccountId ?? null,
        toAccountId: values.toAccountId ?? null,
        categoryId: values.categoryId ?? null,
        amount: values.amount,
        note: values.note || '',
        tags: values.tags || [],
      };
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save transaction');
        return;
      }
    }
    toast.success('Transactions saved');
    setOcrOpen(false);
    await fetchTransactions();
  };

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };

  const pageCount = Math.ceil(total / pageSize);

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
        className="hidden"
        onChange={handleOcrFile}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Track your recent transactions.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          {user?.plan === 'PRO' && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <LucideIcons.Camera className="mr-2 h-4 w-4" /> Scan Receipt
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[250px] justify-start',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              {dateRange.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, 'LLL dd, yyyy')} - ${format(
                    dateRange.to,
                    'LLL dd, yyyy'
                  )}`
                ) : (
                  format(dateRange.from, 'LLL dd, yyyy')
                )
              ) : (
                <span>Pick dates</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as 'actual' | 'budget')}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget">Budget month</SelectItem>
            <SelectItem value="actual">Actual date month</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={dateField}
          onValueChange={(v) => {
            setDateField(v as 'actual' | 'budget');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter month by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="actual">Actual</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search"
          className="w-full md:w-[200px]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedTransactions.map(([month, txs]) => (
              <Fragment key={month}>
                <TableRow>
                  <TableCell colSpan={7} className="font-medium">
                    {format(parseISO(`${month}-01`), 'MMM yyyy')}
                  </TableCell>
                </TableRow>
                {txs.map((t) => {
                  const Icon = t.category?.icon
                    ? (LucideIcons[
                        t.category.icon as keyof typeof LucideIcons
                      ] as any)
                    : null;
                  const title =
                    t.note ||
                    t.category?.name ||
                    (t.type === 'transfer'
                      ? `Transfer from ${t.fromAccount?.name} to ${t.toAccount?.name}`
                      : 'No description');
                  const color =
                    t.type === 'income'
                      ? 'text-green-600'
                      : t.type === 'expense'
                      ? 'text-red-600'
                      : 'text-blue-600';
                  const amountPrefix = t.type === 'expense' ? '-' : '';
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="p-0">
                        {Icon && (
                          <Icon className="h-4 w-4" color={t.category?.color} />
                        )}
                      </TableCell>
                      <TableCell>{title}</TableCell>
                      <TableCell>
                        {format(parseISO(t.actualDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {t.account?.name ||
                          t.fromAccount?.name ||
                          t.toAccount?.name ||
                          '-'}
                      </TableCell>
                      <TableCell>
                        {t.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {t.category.name}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell
                        className={cn('text-right font-medium', color)}
                      >
                        {amountPrefix}
                        {formatIDR(t.amount)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRow(t)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {groupedTransactions.map(([month, txs]) => (
          <div key={month} className="space-y-2">
            <h3 className="text-sm font-medium px-1">
              {(() => {
                try {
                  return format(parseISO(`${month}-01`), 'MMM yyyy');
                } catch (error) {
                  return month;
                }
              })()}
            </h3>
            {txs.map((t) => {
              const Icon = t.category?.icon
                ? (LucideIcons[
                    t.category.icon as keyof typeof LucideIcons
                  ] as any)
                : null;
              const title =
                t.note ||
                t.category?.name ||
                (t.type === 'transfer'
                  ? `Transfer from ${t.fromAccount?.name} to ${t.toAccount?.name}`
                  : 'No description');
              const color =
                t.type === 'income'
                  ? 'text-green-600'
                  : t.type === 'expense'
                  ? 'text-red-600'
                  : 'text-blue-600';
              const amountPrefix = t.type === 'expense' ? '-' : '';
              return (
                <Card
                  key={t.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {Icon && (
                      <Icon className="h-5 w-5" color={t.category?.color} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.actualDate), 'MMM dd, yyyy')}
                      </p>
                      {t.category && (
                        <Badge
                          variant="secondary"
                          className="mt-1 text-xs"
                        >
                          {t.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', color)}>
                      {amountPrefix}
                      {formatIDR(t.amount)}
                    </p>
                    <div className="flex justify-end space-x-1 mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRow(t)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <Pagination className="pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className={
                  page === pageCount ? 'pointer-events-none opacity-50' : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {user?.plan === 'PRO' && (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="md:hidden fixed right-6 bottom-[calc(10rem+env(safe-area-inset-bottom))] rounded-full h-14 w-14 p-0"
        >
          <LucideIcons.Camera className="h-6 w-6" />
        </Button>
      )}

      <Button
        onClick={openNew}
        className="md:hidden fixed right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] rounded-full h-14 w-14 p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>

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
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}
