'use client';

import { useLayoutEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Shuffle, X } from 'lucide-react';
import { shuffleTurns } from '@/lib/arisan';
import { formatDate } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { tr, useT } from '@/lib/i18n';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

async function send(url: string, body: unknown, method = 'POST') {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || tr('Gagal menyimpan', 'Could not save'));
}

type Row = { key: string; name: string; isMe?: boolean };

/**
 * The turn order as a list: move members up and down, take them out, or
 * shuffle the lot (kocok). The first takes the pot in round 1.
 */
export function TurnList({ rows, onChange, removable }: { rows: Row[]; onChange: (rows: Row[]) => void; removable?: boolean }) {
  const { t } = useT();
  const move = (i: number, by: number) => {
    const next = [...rows];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <ol className="divide-y rounded-lg border">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2 px-3 py-1.5 text-sm">
            <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate">
              {r.name}
              {r.isMe && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t('Kamu', 'You')}</span>}
            </span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t(`Naikkan ${r.name}`, `Move ${r.name} up`)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={t(`Turunkan ${r.name}`, `Move ${r.name} down`)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            {removable && (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(rows.filter((x) => x.key !== r.key))} aria-label={t(`Hapus ${r.name}`, `Remove ${r.name}`)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ol>
      {rows.length > 1 && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(shuffleTurns(rows))}>
          <Shuffle className="mr-1.5 h-4 w-4" />
          {t('Kocok urutan', 'Shuffle turns')}
        </Button>
      )}
    </div>
  );
}

/** A new arisan: name, setoran per person, how often, when it starts, and its members in turn order. */
export function ArisanFormDialog({
  open,
  onOpenChange,
  myName,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myName: string;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [newMember, setNewMember] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setName('');
    setAmount(0);
    setFrequency('monthly');
    setStartDate(formatDate(new Date()));
    setRows([{ key: 'me', name: myName || t('Saya', 'Me'), isMe: true }]);
    setNewMember('');
    setError(null);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addMember = () => {
    const names = newMember
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    setRows((r) => [...r, ...names.map((n, i) => ({ key: `${Date.now()}-${i}-${n}`, name: n.slice(0, 60) }))]);
    setNewMember('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t('Isi nama arisan', 'Enter a name'));
    if (amount <= 0) return setError(t('Masukkan setoran per orang', 'Enter the amount per person'));
    if (rows.length < 2) return setError(t('Tambahkan minimal 2 anggota', 'Add at least 2 members'));
    setSaving(true);
    try {
      await send('/api/arisan', { name, amount, frequency, startDate, members: rows.map((r) => ({ name: r.name, isMe: !!r.isMe })) });
      toast.success(t('Arisan dibuat', 'Arisan created'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('Arisan baru', 'New arisan')}</DialogTitle>
            <DialogDescription>
              {t('Setiap putaran semua anggota setor, dan satu orang bergiliran menerima semuanya.', 'Each round everyone puts in, and one member in turn takes the pot.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="arisan-name">{t('Nama arisan', 'Name')}</Label>
            <Input id="arisan-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Arisan RT 05', 'Office arisan')} maxLength={80} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="arisan-amount">{t('Setoran per orang', 'Per person')}</Label>
              <MoneyInput id="arisan-amount" value={amount} onValueChange={setAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arisan-frequency">{t('Setiap', 'Every')}</Label>
              <select id="arisan-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly')} className={selectClass}>
                <option value="monthly">{t('Bulan', 'Month')}</option>
                <option value="weekly">{t('Minggu', 'Week')}</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="arisan-start">{t('Putaran pertama', 'First round')}</Label>
            <Input id="arisan-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arisan-member">{t('Anggota, sesuai urutan giliran', 'Members, in turn order')}</Label>
            <div className="flex gap-2">
              <Input
                id="arisan-member"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMember();
                  }
                }}
                placeholder={t('Nama, pisahkan dengan koma', 'Names, separated by commas')}
              />
              <Button type="button" variant="secondary" onClick={addMember}>
                {t('Tambah', 'Add')}
              </Button>
            </div>
            <TurnList rows={rows} onChange={setRows} removable />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {t('Buat arisan', 'Create arisan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Swaps turns of an existing arisan; payments stay with their member and round. */
export function TurnOrderDialog({
  open,
  onOpenChange,
  arisanId,
  members,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arisanId: string;
  members: { id: string; name: string; isMe: boolean }[];
  onSaved: () => void;
}) {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (open) setRows(members.map((m) => ({ key: m.id, name: m.name, isMe: m.isMe })));
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await send(`/api/arisan/${arisanId}`, { memberOrder: rows.map((r) => r.key) }, 'PATCH');
      toast.success(t('Urutan giliran disimpan', 'Turn order saved'));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Gagal menyimpan', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Urutan giliran', 'Turn order')}</DialogTitle>
          <DialogDescription>{t('Yang pertama menerima di putaran 1.', 'The first takes the pot in round 1.')}</DialogDescription>
        </DialogHeader>
        <TurnList rows={rows} onChange={setRows} />
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {t('Simpan urutan', 'Save order')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
