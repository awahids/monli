'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { Account } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AccountForm } from '@/components/accounts/account-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const typeLabels: Record<Account['type'], string> = {
  bank: 'Bank Account',
  ewallet: 'E-Wallet',
  cash: 'Cash',
};

const formatAccountNumber = (num: string) =>
  num.replace(/(\d{4})(?=\d)/g, '$1 ');

export default function AccountsPage() {
  const { user, setAccounts } = useAppStore();
  const router = useRouter();

  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  // The server's FREE limit counts archived accounts too.
  const disableAdd = user?.plan === 'FREE' && rows.length >= 1;
  const activeAccounts = rows.filter((a) => !a.archived);
  const archivedAccounts = rows.filter((a) => a.archived);
  // Fall back to the active list once nothing is archived (tabs are hidden).
  const currentTab = archivedAccounts.length ? tab : 'active';
  const accounts = currentTab === 'active' ? activeAccounts : archivedAccounts;
  const userInitials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '';

  // Load archived accounts as well so they can be found and restored; only
  // active ones go to the shared store used by transaction forms.
  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/accounts?includeArchived=true&pageSize=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch accounts');
      const all: Account[] = data.rows;
      setRows(all);
      setAccounts(all.filter((a) => !a.archived));
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [user, setAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/accounts/${id}?permanent=true`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || 'Failed to delete account');
      return;
    }
    toast.success('Account deleted');
    await fetchAccounts();
  };

  const handleArchive = async (id: string, archived: boolean) => {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Failed to update account');
      return;
    }
    toast.success(archived ? 'Account archived' : 'Account restored');
    await fetchAccounts();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cards</h2>
          <p className="text-muted-foreground">View and manage your cards.</p>
        </div>
        {!disableAdd && (
          <Button
            onClick={() => {
              setEditingAccount(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Card
          </Button>
        )}
      </div>
      {disableAdd && (
        <p className="text-sm text-muted-foreground">
          Free plan limited to one card.{' '}
          <Link href="/upgrade" className="text-primary underline">
            Upgrade
          </Link>{' '}
          to add more.
        </p>
      )}

      {archivedAccounts.length > 0 && (
        <Tabs value={currentTab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
          <TabsList>
            <TabsTrigger value="active">Active ({activeAccounts.length})</TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedAccounts.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {currentTab === 'active'
            ? 'No cards yet. Add one to start tracking balances.'
            : 'No archived cards.'}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const balance = account.currentBalance ?? 0;
          return (
            <Card
              key={account.id}
              onClick={() =>
                router.push(`/transactions?accountId=${account.id}`)
              }
              className="relative h-56 overflow-hidden rounded-xl text-white shadow hover:shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#0B1324] to-[#1B2537]" />
              <div className="relative z-10 flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <span className="text-sm uppercase tracking-wide">
                    {typeLabels[account.type]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{account.name}</span>
                    {account.archived && (
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white"
                      >
                        Archived
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingAccount(account);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleArchive(account.id, !account.archived)
                          }
                        >
                          {account.archived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete account?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This cannot be undone. Accounts that still have
                                transactions can only be archived.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(account.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {account.accountNumber && (
                  <div className="relative mt-6">
                    <div className="flex items-center">
                      <div className="mr-4 h-8 w-12 rounded-sm bg-gradient-to-br from-yellow-300 to-yellow-500" />
                      <div className="font-mono text-xl tracking-widest">
                        {formatAccountNumber(account.accountNumber)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-6 w-6 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(account.accountNumber!);
                          toast.success('Account number copied');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute left-16 top-full mt-1 text-xs font-mono">
                      {account.accountNumber.slice(0, 4)}
                    </div>
                  </div>
                )}
                <div className="flex items-end justify-between">
                  <span className="text-sm">{userInitials}</span>
                  <div className="text-right">
                    <p className="text-[10px] uppercase">Balance</p>
                    <p className="font-mono text-sm">
                      {formatCurrency(balance, account.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>
              {editingAccount ? 'Edit Card' : 'Add Card'}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 sm:px-0">
            <AccountForm
              account={editingAccount || undefined}
              onSuccess={() => {
                setDialogOpen(false);
                fetchAccounts();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

