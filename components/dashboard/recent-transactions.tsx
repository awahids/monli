'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LazyMotion, m } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Transaction, Account, Category } from '@/types';
import { formatIDR } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Filter,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

export function RecentTransactions({
  transactions,
  accounts,
  categories,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountId: '',
    categoryId: '',
    type: '',
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.actualDate).getTime();
      if (filters.startDate && txDate < new Date(filters.startDate).getTime())
        return false;
      if (filters.endDate && txDate > new Date(filters.endDate).getTime())
        return false;
      if (filters.accountId) {
        const matchesAccount =
          t.accountId === filters.accountId ||
          t.fromAccountId === filters.accountId ||
          t.toAccountId === filters.accountId;
        if (!matchesAccount) return false;
      }
      if (filters.categoryId && t.categoryId !== filters.categoryId)
        return false;
      if (filters.type && t.type !== filters.type) return false;
      return true;
    });
  }, [transactions, filters]);

  const displayedTransactions = useMemo(
    () => filteredTransactions.slice(0, 5),
    [filteredTransactions]
  );

  const loadMotionFeatures = () =>
    import('framer-motion').then((res) => res.domAnimation);
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      return `Transfer from ${transaction.fromAccount?.name} to ${transaction.toAccount?.name}`;
    }
    return transaction.note || transaction.category?.name || 'No description';
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CardHeader className="space-y-2 sticky top-0 z-10 bg-background">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {open ? 'Hide' : 'Filters'}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startDate: e.target.value }))
                }
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endDate: e.target.value }))
                }
              />
              <Select
                value={filters.accountId || 'all' || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    accountId:
                      value === 'all' ? '' : value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {(accounts ?? []).map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    categoryId: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    type: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allall">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={() =>
                  setFilters({
                    startDate: '',
                    endDate: '',
                    accountId: '',
                    categoryId: '',
                    type: '',
                  })
                }
              >
                Clear
              </Button>
            </div>
          </CollapsibleContent>
        </CardHeader>
        <CardContent>
          {displayedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions found.
            </p>
          ) : (
            <LazyMotion features={loadMotionFeatures}>
              <div className="divide-y rounded-md border">
                {displayedTransactions.map((transaction) => (
                  <m.div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {getTransactionDescription(transaction)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                          </p>
                          {transaction.type === 'transfer' ? (
                            <>
                              {transaction.fromAccount && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.fromAccount.name}
                                </Badge>
                              )}
                              {transaction.fromAccount &&
                                transaction.toAccount && (
                                  <span className="text-xs text-muted-foreground">
                                    →
                                  </span>
                                )}
                              {transaction.toAccount && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.toAccount.name}
                                </Badge>
                              )}
                            </>
                          ) : (
                            transaction.account && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.account.name}
                              </Badge>
                            )
                          )}
                          {transaction.category && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category.name}
                            </Badge>
                          )}
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {transaction.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {transaction.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{transaction.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-right sm:w-auto">
                      <p
                        className={`text-sm font-semibold ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {transaction.type === 'expense' ? '-' : ''}
                        {formatIDR(transaction.amount)}
                      </p>
                    </div>
                    </m.div>
                  ))}
                </div>
              </LazyMotion>
          )}
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/transactions">View all transactions</Link>
            </Button>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
