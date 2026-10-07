'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Account } from '@/types';
import type { Debt, DebtKind } from '@/lib/debts';
import { debtStatus } from '@/lib/debts';
import { formatMoney } from '@/lib/currency';
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
import { tr, useT } from '@/lib/i18n';

/** "" = no account: the debt is only recorded, no balance moves. */
function AccountSelect({
  id,
  label,
  accounts,
  value,
  onChange,
}: {
  id: string;
  label: string;
  accounts: Account[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">{t('Tanpa akun (hanya dicatat)', 'No account (record only)')}</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || tr('Gagal menyimpan', 'Could not save'));
}

interface DebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: DebtKind;
  accounts: Account[];
  /** `moved` is true when an account balance changed. */
  onSaved: (moved: boolean) => void;
}

export function DebtFormDialog({ open, onOpenChange, kind: initialKind, accounts, onSaved }: DebtFormProps) {
  const [kind, setKind] = useState<DebtKind>(initialKind);
  const { t } = useT();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setPerson('');
    setAmount(0);
    setAccountId('');
    setDate(formatDate(new Date()));
    setDueDate('');
    setNote('');
    setError(null);
  }, [open, initialKind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.trim()) return setError(t('Isi nama', 'Enter a name'));
    if (amount <= 0) return setError(t('Masukkan nominal', 'Enter an amount'));
    setSaving(true);
    try {
      await post('/api/debts', {
        kind,
        person,
        amount,
        accountId: accountId || null,
        date,
        dueDate: dueDate || null,
        note: note || null,
      });
      toast.success(kind === 'payable' ? t('Hutang dicatat', 'Debt recorded') : t('Piutang dicatat', 'Receivable recorded'));
      onOpenChange(false);
      onSaved(!!accountId);
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
          <DialogTitle>{kind === 'payable' ? t('Hutang baru', 'New debt') : t('Piutang baru', 'New receivable')}</DialogTitle>
          <DialogDescription>{t('Tidak dihitung sebagai pemasukan atau pengeluaran.', 'Not counted as income or spending.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div role="radiogroup" aria-label={t('Jenis', 'Type')} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['payable', 'receivable'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  'rounded-md py-1.5 text-sm font-medium transition-colors',
                  kind === k ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                {k === 'payable' ? t('Saya meminjam', 'I borrowed') : t('Saya meminjamkan', 'I lent')}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-person">{kind === 'payable' ? t('Pinjam dari', 'Borrowed from') : t('Dipinjam oleh', 'Lent to')}</Label>
            <Input
              id="debt-person"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder={t('Mis. Budi', 'e.g. Alex')}
              maxLength={80}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-amount">{t('Nominal', 'Amount')}</Label>
            <MoneyInput id="debt-amount" value={amount} onValueChange={setAmount} />
          </div>
          <AccountSelect
            id="debt-account"
            label={kind === 'payable' ? t('Uang masuk ke akun', 'Money goes into') : t('Uang keluar dari akun', 'Money comes from')}
            accounts={accounts}
            value={accountId}
            onChange={setAccountId}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-date">{t('Tanggal', 'Date')}</Label>
              <Input id="debt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-due">{t('Jatuh tempo (opsional)', 'Due date (optional)')}</Label>
              <Input id="debt-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-note">{t('Catatan (opsional)', 'Note (optional)')}</Label>
            <Input id="debt-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
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

interface PaymentProps {
  debt: Debt | null;
  accounts: Account[];
  onOpenChange: (open: boolean) => void;
  onSaved: (moved: boolean) => void;
}

export function PaymentDialog({ debt, accounts, onOpenChange, onSaved }: PaymentProps) {
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const { t } = useT();

  useEffect(() => {
    if (!debt) return;
    setAmount(debtStatus(debt, '').remaining);
    // Usually repaid through the account the money first went through.
    const principal = debt.entries?.find((e) => e.kind === 'principal')?.account_id;
    setAccountId(principal && accounts.some((a) => a.id === principal) ? principal : '');
    setDate(formatDate(new Date()));
  }, [debt, accounts]);

  if (!debt) return null;
  const { remaining } = debtStatus(debt, '');
  const payable = debt.kind === 'payable';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setSaving(true);
    try {
      await post(`/api/debts/${debt.id}/payments`, { amount, accountId: accountId || null, date });
      toast.success(amount >= remaining ? t('Lunas!', 'Paid off!') : t('Pembayaran dicatat', 'Payment recorded'));
      onOpenChange(false);
      onSaved(!!accountId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Gagal menyimpan', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {payable ? t(`Bayar ke ${debt.person}`, `Pay ${debt.person}`) : t(`Terima dari ${debt.person}`, `Receive from ${debt.person}`)}
          </DialogTitle>
          <DialogDescription>
            {t(`Sisa ${formatMoney(remaining)} dari ${formatMoney(debt.amount)}.`, `${formatMoney(remaining)} left of ${formatMoney(debt.amount)}.`)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <MoneyInput value={amount} onValueChange={setAmount} size="lg" aria-label={t('Nominal', 'Amount')} autoFocus />
          <AccountSelect
            id="payment-account"
            label={payable ? t('Dibayar dari akun', 'Paid from') : t('Masuk ke akun', 'Goes into')}
            accounts={accounts}
            value={accountId}
            onChange={setAccountId}
          />
          <div className="space-y-2">
            <Label htmlFor="payment-date">{t('Tanggal', 'Date')}</Label>
            <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {amount > remaining && (
            <p role="alert" className="text-sm text-destructive">
              {t(`Melebihi sisa ${formatMoney(remaining)}`, `More than the ${formatMoney(remaining)} left`)}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={saving || amount <= 0 || amount > remaining}>
              {saving ? t('Menyimpan...', 'Saving...') : t('Catat pembayaran', 'Record payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
