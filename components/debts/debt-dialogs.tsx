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
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Tanpa akun (hanya dicatat)</option>
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
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
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
    if (!person.trim()) return setError('Isi nama');
    if (amount <= 0) return setError('Masukkan nominal');
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
      toast.success(kind === 'payable' ? 'Hutang dicatat' : 'Piutang dicatat');
      onOpenChange(false);
      onSaved(!!accountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === 'payable' ? 'Hutang baru' : 'Piutang baru'}</DialogTitle>
          <DialogDescription>Tidak dihitung sebagai pemasukan atau pengeluaran.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div role="radiogroup" aria-label="Jenis" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
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
                {k === 'payable' ? 'Saya meminjam' : 'Saya meminjamkan'}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-person">{kind === 'payable' ? 'Pinjam dari' : 'Dipinjam oleh'}</Label>
            <Input
              id="debt-person"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Mis. Budi"
              maxLength={80}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-amount">Nominal</Label>
            <MoneyInput id="debt-amount" value={amount} onValueChange={setAmount} />
          </div>
          <AccountSelect
            id="debt-account"
            label={kind === 'payable' ? 'Uang masuk ke akun' : 'Uang keluar dari akun'}
            accounts={accounts}
            value={accountId}
            onChange={setAccountId}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-date">Tanggal</Label>
              <Input id="debt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-due">Jatuh tempo (opsional)</Label>
              <Input id="debt-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-note">Catatan (opsional)</Label>
            <Input id="debt-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
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
      toast.success(amount >= remaining ? 'Lunas!' : 'Pembayaran dicatat');
      onOpenChange(false);
      onSaved(!!accountId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{payable ? `Bayar ke ${debt.person}` : `Terima dari ${debt.person}`}</DialogTitle>
          <DialogDescription>Sisa {formatMoney(remaining)} dari {formatMoney(debt.amount)}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <MoneyInput value={amount} onValueChange={setAmount} size="lg" aria-label="Nominal" autoFocus />
          <AccountSelect
            id="payment-account"
            label={payable ? 'Dibayar dari akun' : 'Masuk ke akun'}
            accounts={accounts}
            value={accountId}
            onChange={setAccountId}
          />
          <div className="space-y-2">
            <Label htmlFor="payment-date">Tanggal</Label>
            <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {amount > remaining && (
            <p role="alert" className="text-sm text-destructive">
              Melebihi sisa {formatMoney(remaining)}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={saving || amount <= 0 || amount > remaining}>
              {saving ? 'Menyimpan...' : 'Catat pembayaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
