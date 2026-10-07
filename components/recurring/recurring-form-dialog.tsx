'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Account, Category, RecurringTransaction } from '@/types';
import { recurringSchema } from '@/lib/validation';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMessage, useT } from '@/lib/i18n';

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Pengeluaran', en: 'Expense', active: 'bg-red-600 text-white' },
  { value: 'income', label: 'Pemasukan', en: 'Income', active: 'bg-green-600 text-white' },
  { value: 'transfer', label: 'Transfer', en: 'Transfer', active: 'bg-blue-600 text-white' },
] as const;

type Values = {
  type: 'expense' | 'income' | 'transfer';
  accountId: string;
  fromAccountId: string;
  toAccountId: string;
  categoryId: string;
  amount: number;
  note: string;
  frequency: 'weekly' | 'monthly';
  dayOfMonth: number;
  startDate: string;
  endDate: string;
};

function initialValues(rule: RecurringTransaction | null | undefined, accounts: Account[]): Values {
  const today = formatDate(new Date());
  return {
    type: rule?.type ?? 'expense',
    accountId: rule?.accountId ?? accounts[0]?.id ?? '',
    fromAccountId: rule?.fromAccountId ?? accounts[0]?.id ?? '',
    toAccountId: rule?.toAccountId ?? accounts[1]?.id ?? '',
    categoryId: rule?.categoryId ?? '',
    amount: rule?.amount ?? 0,
    note: rule?.note ?? '',
    frequency: rule?.frequency ?? 'monthly',
    dayOfMonth: rule?.dayOfMonth ?? Number(today.slice(8)),
    startDate: rule?.startDate ?? today,
    endDate: rule?.endDate ?? '',
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RecurringTransaction | null;
  accounts: Account[];
  categories: Category[];
  onSaved: () => void;
}

export function RecurringFormDialog({ open, onOpenChange, rule, accounts, categories, onSaved }: Props) {
  const [values, setValues] = useState<Values>(() => initialValues(rule, accounts));
  const { t } = useT();
  const message = useMessage();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(rule, accounts));
      setError(null);
    }
  }, [open, rule, accounts]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const isTransfer = values.type === 'transfer';
  const typeCategories = categories.filter((c) => c.type === values.type);
  const isBackfill = !rule && values.startDate < formatDate(new Date());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = recurringSchema.safeParse({
      type: values.type,
      accountId: isTransfer ? null : values.accountId || null,
      fromAccountId: isTransfer ? values.fromAccountId || null : null,
      toAccountId: isTransfer ? values.toAccountId || null : null,
      categoryId: isTransfer ? null : values.categoryId || null,
      amount: values.amount,
      note: values.note.trim(),
      frequency: values.frequency,
      dayOfMonth: values.frequency === 'monthly' ? values.dayOfMonth : null,
      startDate: values.startDate,
      endDate: values.endDate || null,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue.path[0] === 'amount' ? t('Isi nominal lebih dari 0', 'Enter an amount above 0') : message(issue.message));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(rule ? `/api/recurring/${rule.id}` : '/api/recurring', {
        method: rule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('Gagal menyimpan', 'Could not save'));
      toast.success(rule ? t('Transaksi rutin diperbarui', 'Recurring transaction updated') : t('Transaksi rutin dibuat', 'Recurring transaction created'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? t('Ubah transaksi rutin', 'Edit recurring transaction') : t('Transaksi rutin baru', 'New recurring transaction')}</DialogTitle>
          <DialogDescription>
            {t('Dicatat otomatis setiap jatuh tempo, saat kamu membuka aplikasi.', 'Recorded automatically when due, as you open the app.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div role="radiogroup" aria-label={t('Jenis transaksi', 'Transaction type')} className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={values.type === opt.value}
                onClick={() => setValues((v) => ({ ...v, type: opt.value, categoryId: '' }))}
                className={cn(
                  'rounded-md py-2 text-sm font-medium transition-colors',
                  values.type === opt.value ? opt.active : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(opt.label, opt.en)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-amount">{t('Nominal', 'Amount')}</Label>
            <MoneyInput id="recurring-amount" value={values.amount} onValueChange={(n) => set('amount', n)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-note">{t('Nama', 'Name')}</Label>
            <Input
              id="recurring-note"
              value={values.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder={
                isTransfer
                  ? t('Mis. Tabungan bulanan', 'e.g. Monthly savings')
                  : values.type === 'income'
                    ? t('Mis. Gaji', 'e.g. Salary')
                    : t('Mis. Listrik, Netflix, kos', 'e.g. Electricity, Netflix, rent')
              }
              maxLength={200}
            />
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('Dari akun', 'From account')}</Label>
                <AccountSelect accounts={accounts} value={values.fromAccountId} onChange={(id) => set('fromAccountId', id)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Ke akun', 'To account')}</Label>
                <AccountSelect accounts={accounts} value={values.toAccountId} onChange={(id) => set('toAccountId', id)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('Akun', 'Account')}</Label>
                <AccountSelect accounts={accounts} value={values.accountId} onChange={(id) => set('accountId', id)} />
              </div>
              <div className="space-y-2">
                <Label>{t('Kategori', 'Category')}</Label>
                <Select value={values.categoryId || undefined} onValueChange={(id) => set('categoryId', id)}>
                  <SelectTrigger aria-label={t('Kategori', 'Category')}>
                    <SelectValue placeholder={t('Pilih', 'Choose')} />
                  </SelectTrigger>
                  <SelectContent>
                    {typeCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('Ulangi', 'Repeat')}</Label>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div role="radiogroup" aria-label={t('Frekuensi', 'Frequency')} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(['monthly', 'weekly'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={values.frequency === f}
                    onClick={() => set('frequency', f)}
                    className={cn(
                      'rounded-md py-1.5 text-sm font-medium transition-colors',
                      values.frequency === f ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {f === 'monthly' ? t('Bulanan', 'Monthly') : t('Mingguan', 'Weekly')}
                  </button>
                ))}
              </div>
              {values.frequency === 'monthly' && (
                <Select value={String(values.dayOfMonth)} onValueChange={(d) => set('dayOfMonth', Number(d))}>
                  <SelectTrigger className="w-32" aria-label={t('Tanggal', 'Day')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {t(`Tanggal ${d}`, `Day ${d}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {values.frequency === 'monthly' && values.dayOfMonth > 28 && (
              <p className="text-xs text-muted-foreground">
                {t('Di bulan yang lebih pendek, dicatat di tanggal terakhir bulan itu.', 'In shorter months it is recorded on the last day.')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="recurring-start">{t('Mulai', 'Start')}</Label>
              <Input
                id="recurring-start"
                type="date"
                value={values.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-end">{t('Selesai (opsional)', 'End (optional)')}</Label>
              <Input
                id="recurring-end"
                type="date"
                value={values.endDate}
                min={values.startDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </div>
          </div>
          {isBackfill && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t('Tanggal mulai sudah lewat: transaksi sejak tanggal itu ikut dicatat (maksimal 12).', 'The start date has passed: transactions since then will be recorded too (up to 12).')}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('Batal', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('Menyimpan...', 'Saving...') : t('Simpan', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountSelect({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useT();
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={t('Akun', 'Account')}>
        <SelectValue placeholder={t('Pilih akun', 'Choose account')} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
