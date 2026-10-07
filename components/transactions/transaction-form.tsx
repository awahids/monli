'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';

import { Account, Category, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MoneyInput } from '@/components/ui/money-input';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { cn } from '@/lib/utils';
import { TagSuggestions } from '@/components/transactions/tag-suggestions';
import { defaultBudgetMonth } from '@/lib/budget-period';
import { formatDate } from '@/lib/date';
import { formatMoneyCompact, getDisplayCurrency } from '@/lib/currency';

export const getJakartaDate = () => {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
  return new Date(`${dateStr}T00:00:00+07:00`);
};

export const getCurrentMonth = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .slice(0, 7);


export const formSchema = z
  .object({
    budgetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Pilih bulan budget'),
    actualDate: z.date({ required_error: 'Pilih tanggal' }),
    type: z.enum(['expense', 'income', 'transfer']),
    accountId: z.string().optional(),
    fromAccountId: z.string().optional(),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    amount: z.coerce.number().positive('Masukkan nominal'),
    note: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'expense' || data.type === 'income') {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountId'],
          message: 'Pilih akun',
        });
      }
    } else if (data.type === 'transfer') {
      if (!data.fromAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromAccountId'],
          message: 'Pilih akun asal',
        });
      }
      if (!data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'Pilih akun tujuan',
        });
      } else if (data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'Akun asal dan tujuan harus berbeda',
        });
      }
    }
  });

// Use the inferred output type for consumers of the form
export type TransactionFormValues = z.infer<typeof formSchema>;
type FormInput = z.input<typeof formSchema>;

/** "YYYY-MM-DD" stored dates are Jakarta calendar days. */
const fromStoredDate = (value: string) => new Date(`${value}T00:00:00+07:00`);

/**
 * Form values for editing a saved transaction. Rows store null for fields of
 * other types; the schema wants undefined, otherwise validation fails on a
 * hidden field and Save silently does nothing.
 */
export const toFormValues = (t: Transaction): FormInput => ({
  budgetMonth: t.budgetMonth,
  actualDate: fromStoredDate(t.actualDate),
  type: t.type,
  accountId: t.accountId ?? undefined,
  fromAccountId: t.fromAccountId ?? undefined,
  toAccountId: t.toAccountId ?? undefined,
  categoryId: t.categoryId,
  amount: t.amount,
  note: t.note || '',
  tags: t.tags || [],
});

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Pengeluaran', active: 'bg-red-600 text-white' },
  { value: 'income', label: 'Pemasukan', active: 'bg-green-600 text-white' },
  { value: 'transfer', label: 'Transfer', active: 'bg-blue-600 text-white' },
] as const;

const LAST_ACCOUNT_KEY = 'qala-saku:last-account';
const lastCategoryKey = (type: string) => `qala-saku:last-category:${type}`;

function readPref(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writePref(key: string, value: string | null | undefined) {
  try {
    if (value) localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); remembering is optional.
  }
}

/** Quick-add amounts: thousands for Rupiah, small steps for other currencies. */
function quickAmounts(currency: string) {
  return currency === 'IDR' ? [10000, 20000, 50000, 100000] : [5, 10, 20, 50];
}

function AccountChips({
  accounts,
  value,
  onChange,
  exclude,
}: {
  accounts: Account[];
  value?: string;
  onChange: (id: string) => void;
  exclude?: string;
}) {
  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada akun.{' '}
        <Link href="/accounts" className="font-medium text-primary underline-offset-4 hover:underline">
          Buat akun dulu
        </Link>
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {accounts
        .filter((a) => a.id !== exclude)
        .map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={value === a.id}
            onClick={() => onChange(a.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              value === a.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            )}
          >
            {a.name}
          </button>
        ))}
    </div>
  );
}

interface FieldsProps {
  form: UseFormReturn<FormInput, any, TransactionFormValues>;
  accounts: Account[];
  categories: Category[];
  contentEl: HTMLDivElement | null;
  autoFocusAmount?: boolean;
}

export function TransactionFields({
  form,
  accounts,
  categories,
  contentEl,
  autoFocusAmount = false,
}: FieldsProps) {
  const currentType = form.watch('type');
  const actualDate = form.watch('actualDate');
  const [tagInput, setTagInput] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const currency = getDisplayCurrency();

  const today = getJakartaDate();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const setDate = (date: Date) => {
    form.setValue('actualDate', date, { shouldValidate: true });
    form.setValue('budgetMonth', defaultBudgetMonth(date));
  };
  const isSameDay = (a?: Date, b?: Date) =>
    Boolean(a && b && formatDate(a) === formatDate(b));
  const isCustomDate = actualDate && !isSameDay(actualDate, today) && !isSameDay(actualDate, yesterday);

  const typeCategories = categories.filter((c) => c.type === currentType);

  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <div role="radiogroup" aria-label="Jenis transaksi" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === opt.value}
                  onClick={() => {
                    if (field.value === opt.value) return;
                    field.onChange(opt.value);
                    // A category belongs to one type; pre-select the last
                    // one used for the new type instead of keeping a stale one.
                    const last = readPref(lastCategoryKey(opt.value));
                    form.setValue(
                      'categoryId',
                      categories.some((c) => c.id === last && c.type === opt.value) ? last : undefined
                    );
                    form.clearErrors();
                  }}
                  className={cn(
                    'rounded-md py-2 text-sm font-medium transition-colors',
                    field.value === opt.value ? opt.active : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Nominal</FormLabel>
            <FormControl>
              <MoneyInput
                size="lg"
                aria-label="Nominal"
                autoFocus={autoFocusAmount}
                value={typeof field.value === 'number' ? field.value : Number(field.value) || 0}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <div className="flex flex-wrap gap-2">
              {quickAmounts(currency).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    const current = Number(form.getValues('amount')) || 0;
                    form.setValue('amount', current + step, { shouldValidate: true });
                  }}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  +{formatMoneyCompact(step, currency)}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {currentType !== 'transfer' && (
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              {typeCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kategori {currentType === 'income' ? 'pemasukan' : 'pengeluaran'}.{' '}
                  <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
                    Tambah di Pengaturan
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {typeCategories.map((c) => {
                    const selected = field.value === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => field.onChange(selected ? undefined : c.id)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-xs transition-colors',
                          selected ? 'border-primary bg-accent text-accent-foreground ring-1 ring-primary' : 'hover:bg-muted'
                        )}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${c.color || '#6B7280'}22`, color: c.color || undefined }}
                        >
                          <CategoryIcon name={c.icon} className="h-4 w-4" />
                        </span>
                        <span className="line-clamp-1 w-full">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {currentType !== 'transfer' ? (
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Akun</FormLabel>
              <AccountChips accounts={accounts} value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dari akun</FormLabel>
                <AccountChips accounts={accounts} value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ke akun</FormLabel>
                <AccountChips
                  accounts={accounts}
                  value={field.value}
                  onChange={field.onChange}
                  exclude={form.watch('fromAccountId')}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={form.control}
        name="actualDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tanggal</FormLabel>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Hari ini', date: today },
                { label: 'Kemarin', date: yesterday },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={isSameDay(field.value, opt.date)}
                  onClick={() => setDate(opt.date)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    isSameDay(field.value, opt.date)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      isCustomDate ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {isCustomDate && field.value
                      ? format(field.value, 'd MMM yyyy', { locale: localeId })
                      : 'Pilih tanggal'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" container={contentEl ?? undefined}>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => date && setDate(date)}
                    disabled={(date) => date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan</FormLabel>
            <FormControl>
              <Input placeholder="mis. Makan siang bareng tim" {...field} />
            </FormControl>
            <TagSuggestions
              note={field.value}
              categoryId={currentType === 'transfer' ? undefined : form.watch('categoryId') ?? undefined}
              tags={form.watch('tags') ?? []}
              onAdd={(tag) =>
                form.setValue('tags', [...(form.getValues('tags') ?? []), tag], { shouldDirty: true })
              }
            />
            {(form.watch('tags') ?? []).length > 0 && !moreOpen && (
              <p className="text-xs text-muted-foreground">
                Tag: {(form.watch('tags') ?? []).join(', ')}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Lainnya: bulan budget & tag
            <ChevronDown className={cn('h-4 w-4 transition-transform', moreOpen && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <FormField
            control={form.control}
            name="budgetMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Masuk budget bulan</FormLabel>
                <FormControl>
                  <Input type="month" {...field} />
                </FormControl>
                <FormDescription>
                  Otomatis mengikuti tanggal dan periode budget di Pengaturan. Ubah kalau
                  transaksi ini milik budget bulan lain.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {field.value?.map((tag, idx) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          aria-label={`Hapus tag ${tag}`}
                          onClick={() =>
                            field.onChange((field.value ?? []).filter((_, i) => i !== idx))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      value={tagInput}
                      placeholder="Ketik lalu Enter"
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          const newTag = tagInput.trim();
                          if (!field.value?.includes(newTag)) {
                            field.onChange([...(field.value || []), newTag]);
                          }
                          setTagInput('');
                        }
                      }}
                      className="min-w-[140px] flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  id?: string;
  initialValues?: Partial<TransactionFormValues>;
}

/** Defaults for a new transaction: today, plus the last account/category used. */
function newDefaults(
  accounts: Account[],
  categories: Category[],
  initial?: Partial<TransactionFormValues>
): FormInput {
  const type = initial?.type ?? 'expense';
  const lastAccount = readPref(LAST_ACCOUNT_KEY);
  const lastCategory = readPref(lastCategoryKey(type));
  const accountId =
    initial?.accountId ??
    (accounts.some((a) => a.id === lastAccount) ? lastAccount : accounts[0]?.id);
  const categoryId =
    initial?.categoryId ??
    (categories.some((c) => c.id === lastCategory && c.type === type) ? lastCategory : undefined);
  const actualDate = initial?.actualDate ?? getJakartaDate();
  return {
    budgetMonth: initial?.budgetMonth ?? defaultBudgetMonth(actualDate),
    actualDate,
    type,
    accountId,
    fromAccountId: initial?.fromAccountId ?? (type === 'transfer' ? accountId : undefined),
    toAccountId: initial?.toAccountId,
    categoryId,
    amount: initial?.amount ?? 0,
    note: initial?.note ?? '',
    tags: initial?.tags ?? [],
  };
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSubmit,
  onDelete,
  id,
  initialValues,
}: Props) {
  // react-hook-form's resolver expects the schema's input type, while the
  // submit handler uses the parsed output type.
  const form = useForm<FormInput, any, TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: newDefaults([], []),
  });

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      form.reset(toFormValues(transaction));
    } else {
      form.reset(newDefaults(accounts, categories, initialValues));
    }
    // Reset only when the dialog opens or switches transaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction, initialValues]);

  // onSubmit throws on failure: keep the input and show the error instead of
  // resetting the form.
  const handleSubmit = async (values: TransactionFormValues) => {
    try {
      await onSubmit(values);
    } catch (e) {
      toast.error((e as Error).message || 'Gagal menyimpan transaksi');
      return;
    }
    if (values.type === 'transfer') {
      writePref(LAST_ACCOUNT_KEY, values.fromAccountId);
    } else {
      writePref(LAST_ACCOUNT_KEY, values.accountId);
      writePref(lastCategoryKey(values.type), values.categoryId);
    }
  };

  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);
  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id={id}
        ref={setContentEl}
        className="fixed top-auto bottom-0 left-0 right-0 w-full h-[92vh] overflow-y-auto p-0 rounded-t-xl sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-xl sm:p-6"
      >
        <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0">
          <DialogTitle>{transaction ? 'Edit transaksi' : 'Tambah transaksi'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pb-24 px-4 sm:px-0 sm:pb-0"
          >
            <TransactionFields
              form={form}
              accounts={accounts}
              categories={categories}
              contentEl={contentEl}
              autoFocusAmount={!transaction}
            />

            <DialogFooter
              className="fixed sm:sticky bottom-0 left-0 right-0 flex flex-row justify-between gap-2 border-t bg-background px-4 py-4 z-10 sm:px-0"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
            >
              {transaction && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete()}
                  disabled={isSubmitting}
                >
                  Hapus
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={isSubmitting} className="min-w-28">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionForm;
