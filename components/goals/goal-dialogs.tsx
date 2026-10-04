'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { SavingsGoal } from '@/types';
import { savingsGoalSchema } from '@/lib/validation';
import { formatMoney } from '@/lib/currency';
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
import { CategoryIcon } from '@/components/transactions/category-icon';

export const GOAL_ICONS = ['PiggyBank', 'Plane', 'House', 'Car', 'GraduationCap', 'Smartphone', 'HeartPulse', 'Gift'];
export const GOAL_COLORS = ['#14A7A0', '#F9A620', '#6366F1', '#EC4899', '#22C55E', '#0EA5E9'];

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoal | null;
  onSaved: () => void;
}

export function GoalFormDialog({ open, onOpenChange, goal, onSaved }: GoalFormProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [savedAmount, setSavedAmount] = useState(0);
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? '');
    setTargetAmount(goal?.targetAmount ?? 0);
    setSavedAmount(goal?.savedAmount ?? 0);
    setTargetDate(goal?.targetDate ?? '');
    setIcon(goal?.icon ?? GOAL_ICONS[0]);
    setColor(goal?.color ?? GOAL_COLORS[0]);
    setError(null);
  }, [open, goal]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = savingsGoalSchema.safeParse({
      name,
      targetAmount,
      savedAmount,
      targetDate: targetDate || null,
      icon,
      color,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'name' ? 'Beri nama target' : field === 'targetAmount' ? 'Isi target lebih dari 0' : 'Periksa isian');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(goal ? `/api/goals/${goal.id}` : '/api/goals', {
        method: goal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      toast.success(goal ? 'Target diperbarui' : 'Target tabungan dibuat');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? 'Ubah target' : 'Target tabungan baru'}</DialogTitle>
          <DialogDescription>Dana darurat, liburan, DP rumah: tentukan jumlah dan kapan ingin tercapai.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nama</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Dana darurat"
              maxLength={80}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target</Label>
              <MoneyInput id="goal-target" value={targetAmount} onValueChange={setTargetAmount} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-saved">Sudah terkumpul</Label>
              <MoneyInput id="goal-saved" value={savedAmount} onValueChange={setSavedAmount} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-date">Tercapai pada (opsional)</Label>
            <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ikon & warna</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ikon">
              {GOAL_ICONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={icon === name}
                  aria-label={name}
                  onClick={() => setIcon(name)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                    icon === name ? 'border-transparent text-white' : 'text-muted-foreground hover:bg-muted'
                  )}
                  style={icon === name ? { backgroundColor: color } : undefined}
                >
                  <CategoryIcon name={name} className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Warna">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`Warna ${c}`}
                  onClick={() => setColor(c)}
                  className={cn('h-7 w-7 rounded-full ring-offset-2 ring-offset-background', color === c && 'ring-2 ring-ring')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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

interface ContributeProps {
  goal: SavingsGoal | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (goal: SavingsGoal) => void;
}

/** Deposit to or withdraw from a goal's saved amount. */
export function ContributeDialog({ goal, onOpenChange, onSaved }: ContributeProps) {
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setMode('in');
      setAmount(0);
    }
  }, [goal]);

  if (!goal) return null;
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: mode === 'in' ? amount : -amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      onSaved(data);
      toast.success(mode === 'in' ? 'Setoran dicatat' : 'Penarikan dicatat');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal.name}</DialogTitle>
          <DialogDescription>
            Terkumpul {formatMoney(goal.savedAmount)} dari {formatMoney(goal.targetAmount)}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div role="radiogroup" aria-label="Jenis" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['in', 'out'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-md py-1.5 text-sm font-medium transition-colors',
                  mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                {m === 'in' ? 'Setor' : 'Tarik'}
              </button>
            ))}
          </div>
          <MoneyInput value={amount} onValueChange={setAmount} size="lg" aria-label="Nominal" autoFocus />
          {mode === 'in' && remaining > 0 && (
            <button
              type="button"
              onClick={() => setAmount(remaining)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            >
              Lunasi sisa {formatMoney(remaining)}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Ini hanya mencatat progres target. Pindahkan uangnya lewat transfer antar akun bila perlu.
          </p>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={saving || amount <= 0}>
              {saving ? 'Menyimpan...' : mode === 'in' ? 'Catat setoran' : 'Catat penarikan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
