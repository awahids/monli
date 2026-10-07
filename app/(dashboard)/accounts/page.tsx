'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Copy,
  Eye,
  EyeOff,
  Landmark,
  MoreHorizontal,
  Plus,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { Account } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountForm } from '@/components/accounts/account-form';
import { cn } from '@/lib/utils';

// Card face per account type, in the Qala palette (deep teal, navy, warm gold).
const TYPE_META: Record<Account['type'], { label: string; icon: typeof Wallet; gradient: string }> = {
  bank: { label: 'Bank', icon: Landmark, gradient: 'bg-gradient-to-br from-[#0B0F24] via-[#12304a] to-[#0E8079]' },
  ewallet: { label: 'E-wallet', icon: Smartphone, gradient: 'bg-gradient-to-br from-[#0E8079] via-[#14A7A0] to-[#0b5d58]' },
  cash: { label: 'Tunai', icon: Wallet, gradient: 'bg-gradient-to-br from-[#7a4a0b] via-[#b8730f] to-[#3d2a0b]' },
};

const HIDE_KEY = 'qala-saku:hide-balances';

const maskNumber = (num: string) => `•••• •••• ${num.slice(-4)}`;
/** Groups digits in fours like a printed card: 1234 5678 90. */
const formatAccountNumber = (num: string) => num.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');

export default function AccountsPage() {
  const { user, setAccounts, dataVersion } = useAppStore();
  const router = useRouter();

  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [hideBalances, setHideBalances] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setHideBalances(localStorage.getItem(HIDE_KEY) === '1');
    } catch {
      // Remembering the choice is optional.
    }
  }, []);
  const toggleHide = () => {
    setHideBalances((h) => {
      try {
        localStorage.setItem(HIDE_KEY, h ? '0' : '1');
      } catch {
        // ignore
      }
      return !h;
    });
  };

  // The server's FREE limit counts archived accounts too.
  const disableAdd = user?.plan === 'FREE' && rows.length >= 1;
  const activeAccounts = rows.filter((a) => !a.archived);
  const archivedAccounts = rows.filter((a) => a.archived);
  // Fall back to the active list once nothing is archived (tabs are hidden).
  const currentTab = archivedAccounts.length ? tab : 'active';
  const accounts = currentTab === 'active' ? activeAccounts : archivedAccounts;
  const totalBalance = activeAccounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

  // Load archived accounts as well so they can be found and restored; only
  // active ones go to the shared store used by transaction forms.
  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/accounts?includeArchived=true&pageSize=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat akun');
      const all: Account[] = data.rows;
      setRows(all);
      setAccounts(all.filter((a) => !a.archived));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Gagal memuat akun');
    } finally {
      setLoading(false);
    }
  }, [user, setAccounts]);

  // dataVersion: balances change when a transaction is added (e.g. the + button).
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, dataVersion]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const res = await fetch(`/api/accounts/${pendingDelete.id}?permanent=true`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        res.status === 409
          ? 'Akun ini masih punya transaksi. Arsipkan saja, atau hapus transaksinya dulu.'
          : data.error || 'Gagal menghapus akun'
      );
      return;
    }
    toast.success('Akun dihapus');
    setPendingDelete(null);
    await fetchAccounts();
  };

  const handleArchive = async (account: Account, archived: boolean) => {
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Gagal memperbarui akun');
      return;
    }
    toast.success(archived ? `${account.name} diarsipkan` : `${account.name} dipulihkan`);
    await fetchAccounts();
  };

  const openNew = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const money = (amount: number, currency: string) =>
    hideBalances ? '••••••' : formatMoney(amount, currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Akun</h1>
          <p className="text-sm text-muted-foreground">Rekening bank, e-wallet, dan uang tunai.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleHide}
            aria-label={hideBalances ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            title={hideBalances ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          >
            {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          {!disableAdd && (
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" /> Tambah akun
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Memuat akun">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[1.586/1] rounded-2xl" />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada akun"
          description="Tambahkan rekening, e-wallet, atau dompet tunai beserta saldonya saat ini."
          action={<Button onClick={openNew}>Tambah akun pertama</Button>}
        />
      ) : (
        <>
          <Card className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total saldo akun aktif</p>
              <p className="font-display text-2xl font-bold tabular-nums">
                {money(totalBalance, user?.defaultCurrency || 'IDR')}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{activeAccounts.length} akun</p>
          </Card>

          {disableAdd && (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Paket FREE dibatasi 1 akun.{' '}
              <Link href="/upgrade" className="font-medium text-primary underline-offset-4 hover:underline">
                Upgrade ke PRO
              </Link>{' '}
              untuk menambah akun tanpa batas.
            </p>
          )}

          {archivedAccounts.length > 0 && (
            <Tabs value={currentTab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
              <TabsList>
                <TabsTrigger value="active">Aktif ({activeAccounts.length})</TabsTrigger>
                <TabsTrigger value="archived">Diarsipkan ({archivedAccounts.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {currentTab === 'active' ? 'Semua akun sedang diarsipkan.' : 'Tidak ada akun yang diarsipkan.'}
            </p>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const meta = TYPE_META[account.type];
                const Icon = meta.icon;
                const balance = account.currentBalance ?? 0;
                const isRevealed = revealed[account.id];
                return (
                  <div
                    key={account.id}
                    className={cn(
                      'group relative aspect-[1.586/1] overflow-hidden rounded-2xl text-white shadow-md ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-xl',
                      meta.gradient,
                      account.archived && 'opacity-60 saturate-50'
                    )}
                  >
                    {/* Decorative rings, echoing the Qala mark */}
                    <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full border-[18px] border-white/10" />
                    <span aria-hidden className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full border-[14px] border-white/5" />

                    {/* Whole card opens the account's transactions; controls sit above it. */}
                    <button
                      type="button"
                      className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      onClick={() => router.push(`/transactions?accountId=${account.id}`)}
                      aria-label={`Lihat transaksi ${account.name}`}
                    />

                    <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-white/70">
                            <Icon className="h-3.5 w-3.5" /> {meta.label}
                          </p>
                          <p className="mt-1 truncate font-display text-lg font-semibold">{account.name}</p>
                        </div>
                        <div className="pointer-events-auto flex shrink-0 items-center gap-1">
                          {account.archived && (
                            <Badge className="border-0 bg-white/20 text-white hover:bg-white/20">Diarsipkan</Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                aria-label={`Aksi untuk ${account.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingAccount(account);
                                  setDialogOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(account, !account.archived)}>
                                {account.archived ? 'Pulihkan' : 'Arsipkan'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setPendingDelete(account)}
                              >
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="h-7 w-10 shrink-0 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-inner"
                        />
                        {account.accountNumber ? (
                          <>
                            <span className="truncate font-mono text-base tracking-[0.2em]">
                              {isRevealed ? formatAccountNumber(account.accountNumber) : maskNumber(account.accountNumber)}
                            </span>
                            <span className="pointer-events-auto ml-auto flex shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                                onClick={() => setRevealed((r) => ({ ...r, [account.id]: !r[account.id] }))}
                                aria-label={isRevealed ? 'Sembunyikan nomor' : 'Tampilkan nomor'}
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(account.accountNumber!);
                                  toast.success('Nomor rekening disalin');
                                }}
                                aria-label="Salin nomor rekening"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </span>
                          </>
                        ) : null}
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <span className="truncate text-xs uppercase tracking-wider text-white/70">
                          {user?.name || 'Qala Saku'}
                        </span>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-white/60">Saldo</p>
                          <p
                            className={cn(
                              'font-display text-xl font-bold tabular-nums',
                              balance < 0 && !hideBalances && 'text-red-200'
                            )}
                          >
                            {money(balance, account.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>{editingAccount ? 'Edit akun' : 'Tambah akun'}</DialogTitle>
          </DialogHeader>
          <div className="px-4">
            <AccountForm
              key={editingAccount?.id ?? 'new'}
              account={editingAccount || undefined}
              onSuccess={() => {
                setDialogOpen(false);
                fetchAccounts();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Hapus ${pendingDelete?.name ?? 'akun'}?`}
        description="Akun yang masih punya transaksi tidak bisa dihapus, hanya bisa diarsipkan. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
      />
    </div>
  );
}
