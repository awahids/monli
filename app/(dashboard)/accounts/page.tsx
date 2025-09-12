'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';


export default function AccountsPage() {
  const {
    user,
    accounts,
    setAccounts,
    loading,
    setLoading,
  } = useAppStore();

  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const disableAdd = user?.plan === 'FREE' && accounts.length >= 1;

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch accounts');
      setAccounts(data.rows);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [user, page, setAccounts, setLoading]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cards</h2>
        {!disableAdd && (
          <div className="hidden md:block">
            <Button
              onClick={() => {
                setEditingAccount(null);
                setDialogOpen(true);
              }}
              className="transition-transform hover:scale-105"
            >
              Add Card
            </Button>
          </div>
        )}
      </div>
      {disableAdd && (
        <p className="text-sm text-muted-foreground">
          Free plan limited to one account.{' '}
          <Link href="/upgrade" className="text-primary underline">
            Upgrade
          </Link>{' '}
          to add more.
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
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
              <div className="relative z-10 flex h-full flex-col justify-between p-6">
                <div className="flex justify-between text-sm tracking-widest">
                  <span>
                    **** {account.accountNumber?.slice(-4) || '0000'}
                  </span>
                  <span className="uppercase">
                    {account.type === 'bank' ? 'visa' : account.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs">Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(balance, account.currency)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {total > pageSize && (
        <Pagination className="pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(total / pageSize) }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
                }
                className={
                  page === Math.ceil(total / pageSize)
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {!disableAdd && (
        <Button
          onClick={() => {
            setEditingAccount(null);
            setDialogOpen(true);
          }}
          className="md:hidden fixed right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] h-12 w-12 rounded-full p-0 shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add Account'}
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

