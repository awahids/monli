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

const TYPE_META: Record<Account['type'], { label: string; icon: typeof Wallet }> = {
  bank: { label: 'Bank', icon: Landmark },
  ewallet: { label: 'E-wallet', icon: Smartphone },
  cash: { label: 'Tunai', icon: Wallet },
};

const HIDE_KEY = 'qala-saku:hide-balances';

const maskNumber = (num: string) => `•••• ${num.slice(-4)}`;

export default function AccountsPage() {
  const { user, setAccounts } = useAppStore();
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

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Akun</h1>
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
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
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
              <p className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
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
            <div className="grid gap-3 md:grid-cols-2">
              {accounts.map((account) => {
                const meta = TYPE_META[account.type];
                const Icon = meta.icon;
                const balance = account.currentBalance ?? 0;
                return (
                  <Card
                    key={account.id}
                    className={cn('flex items-center gap-4 p-4 transition-colors hover:bg-muted/40', account.archived && 'opacity-70')}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      onClick={() => router.push(`/transactions?accountId=${account.id}`)}
                      aria-label={`Lihat transaksi ${account.name}`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{account.name}</span>
                          {account.archived && <Badge variant="secondary">Diarsipkan</Badge>}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {meta.label}
                          {account.accountNumber &&
                            ` · ${revealed[account.id] ? account.accountNumber : maskNumber(account.accountNumber)}`}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-right font-semibold tabular-nums',
                          balance < 0 && !hideBalances && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {money(balance, account.currency)}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${account.name}`}>
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
                        {account.accountNumber && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                setRevealed((r) => ({ ...r, [account.id]: !r[account.id] }))
                              }
                            >
                              {revealed[account.id] ? 'Sembunyikan nomor' : 'Tampilkan nomor'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(account.accountNumber!);
                                toast.success('Nomor rekening disalin');
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Salin nomor
                            </DropdownMenuItem>
                          </>
                        )}
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
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>{editingAccount ? 'Edit akun' : 'Tambah akun'}</DialogTitle>
          </DialogHeader>
          <div className="px-4 sm:px-0">
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
