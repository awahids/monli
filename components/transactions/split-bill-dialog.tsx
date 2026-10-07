'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { defaultBudgetMonth } from '@/lib/budget-period';
import { splitEvenly } from '@/lib/split';
import { refreshActiveAccounts, saveTransaction } from '@/lib/transactions-client';
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
import { useT } from '@/lib/i18n';

/** A share of the bill: mine under a category, or a friend's (becomes piutang). */
type Part = { key: number; friend: boolean; categoryId: string; person: string; amount: number };

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

let nextKey = 0;
const part = (friend: boolean): Part => ({ key: nextKey++, friend, categoryId: '', person: '', amount: 0 });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Splits one bill paid from one account: my shares become expenses per
 * category, friends' shares become piutang lent from the same account, so the
 * account drops by the full bill while only my part counts as spending.
 */
export function SplitBillDialog({ open, onOpenChange }: Props) {
  const { user, space, accounts, categories } = useAppStore();
  const { t } = useT();
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [total, setTotal] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTotal(0);
    setAccountId(accounts[0]?.id ?? '');
    setDate(formatDate(new Date()));
    setNote('');
    setParts([part(false), part(true)]);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Accounts may arrive after the dialog opened.
  useEffect(() => {
    if (open && !accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [open, accountId, accounts]);

  const assigned = parts.reduce((s, p) => s + p.amount, 0);
  const left = total - assigned;
  const incomplete = parts.some((p) => p.amount <= 0 || (p.friend ? !p.person.trim() : !p.categoryId));
  const canSave = total > 0 && left === 0 && !incomplete && !!accountId && parts.length > 0;

  const update = (key: number, patch: Partial<Part>) =>
    setParts((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const evenly = () => {
    const amounts = splitEvenly(total, parts.length);
    setParts((ps) => ps.map((p, i) => ({ ...p, amount: amounts[i] })));
  };

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    const ownerId = space?.ownerId ?? user.id;
    const title = note.trim() || t('Bagi tagihan', 'Split bill');
    let saved = 0;
    try {
      for (const p of parts) {
        if (p.friend) {
          const res = await fetch('/api/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'receivable', person: p.person, amount: p.amount, accountId, date, note: title }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || t('Gagal mencatat piutang', 'Could not record the receivable'));
        } else {
          await saveTransaction({
            budgetMonth: defaultBudgetMonth(new Date(`${date}T00:00:00+07:00`)),
            actualDate: date,
            date,
            type: 'expense',
            accountId,
            fromAccountId: null,
            toAccountId: null,
            categoryId: p.categoryId,
            amount: p.amount,
            note: title,
            tags: [],
          });
        }
        saved += 1;
      }
      const friends = parts.filter((p) => p.friend).length;
      toast.success(
        friends
          ? t(`Tersimpan, ${friends} piutang dicatat`, `Saved, ${friends} receivables recorded`)
          : t('Tersimpan', 'Saved')
      );
      onOpenChange(false);
    } catch (e) {
      // Drop the shares already saved so a retry does not duplicate them.
      const done = parts.slice(0, saved);
      setParts((ps) => ps.slice(saved));
      setTotal((t) => t - done.reduce((s, p) => s + p.amount, 0));
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
      await refreshActiveAccounts(ownerId);
      useAppStore.getState().bumpData();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Bagi tagihan', 'Split bill')}</DialogTitle>
          <DialogDescription>
            {t(
              'Bagianmu dicatat sebagai pengeluaran per kategori; bagian teman jadi piutang.',
              "Your share is recorded as spending per category; friends' shares become receivables."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="split-total">{t('Total tagihan', 'Bill total')}</Label>
            <MoneyInput id="split-total" value={total} onValueChange={setTotal} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="split-account">{t('Dibayar dari', 'Paid from')}</Label>
              <select id="split-account" className={selectClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="split-date">{t('Tanggal', 'Date')}</Label>
              <Input id="split-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="split-note">{t('Catatan', 'Note')}</Label>
            <Input
              id="split-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('Mis. Makan bareng tim', 'e.g. Team dinner')}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('Pembagian', 'Shares')}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={evenly} disabled={total <= 0 || !parts.length}>
                {t('Bagi rata', 'Split evenly')}
              </Button>
            </div>
            {parts.map((p, i) => (
              <div key={p.key} className="flex items-center gap-2">
                {p.friend ? (
                  <Input
                    value={p.person}
                    onChange={(e) => update(p.key, { person: e.target.value })}
                    placeholder={t('Nama teman', "Friend's name")}
                    aria-label={t(`Nama teman ${i + 1}`, `Friend name ${i + 1}`)}
                    maxLength={80}
                  />
                ) : (
                  <select
                    className={selectClass}
                    value={p.categoryId}
                    onChange={(e) => update(p.key, { categoryId: e.target.value })}
                    aria-label={t(`Kategori bagian ${i + 1}`, `Share category ${i + 1}`)}
                  >
                    <option value="">{t('Bagianku: kategori…', 'My share: category…')}</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <MoneyInput
                  className="w-36 shrink-0"
                  value={p.amount}
                  onValueChange={(amount) => update(p.key, { amount })}
                  aria-label={t(`Nominal bagian ${i + 1}`, `Share amount ${i + 1}`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={t(`Hapus bagian ${i + 1}`, `Remove share ${i + 1}`)}
                  onClick={() => setParts((ps) => ps.filter((x) => x.key !== p.key))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setParts((ps) => [...ps, part(false)])}>
                <Plus className="mr-1 h-4 w-4" /> {t('Kategori', 'Category')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setParts((ps) => [...ps, part(true)])}>
                <UserPlus className="mr-1 h-4 w-4" /> {t('Teman', 'Friend')}
              </Button>
            </div>
            <p
              role="status"
              className={cn('text-sm', left === 0 ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-400')}
            >
              {left === 0
                ? t('Pas dengan total.', 'Matches the total.')
                : left > 0
                  ? t(`Belum dibagi ${formatMoney(left)}`, `${formatMoney(left)} not assigned`)
                  : t(`Kelebihan ${formatMoney(-left)}`, `${formatMoney(-left)} too much`)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={save} disabled={saving || !canSave}>
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
