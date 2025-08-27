"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Receipt, Plus, PieChart, Settings } from "lucide-react";
import TransactionForm, {
  TransactionFormValues,
} from "@/components/transactions/transaction-form";
import type { Transaction } from "@/types";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";
import { useOffline } from "@/hooks/use-offline";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as any;
  }
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamel(key)] = keysToCamel(value);
    }
    return result as T;
  }
  return obj as T;
}

const links = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/transactions", icon: Receipt, label: "Transactions" },
  // index 2 akan diisi tombol Plus
  { href: "/budgets", icon: PieChart, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const {
    user,
    accounts,
    categories,
    transactions,
    setTransactions,
  } = useAppStore();
  const { isOnline, addOfflineChange } = useOffline();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const handleAddTransaction = () => {
    setTransaction(undefined);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = {
      budgetMonth: values.budgetMonth,
      actualDate: formatDate(values.actualDate),
      date: formatDate(values.actualDate),
      type: values.type,
      accountId: values.accountId ?? null,
      fromAccountId: values.fromAccountId ?? null,
      toAccountId: values.toAccountId ?? null,
      categoryId: values.categoryId ?? null,
      amount: values.amount,
      note: values.note || '',
      tags: values.tags || [],
    };

    if (!isOnline) {
      const tempTx: Transaction = {
        id: `offline-${Date.now()}`,
        userId: user?.id || '',
        budgetMonth: payload.budgetMonth,
        actualDate: payload.actualDate,
        date: payload.date,
        type: payload.type,
        accountId: payload.accountId ?? undefined,
        fromAccountId: payload.fromAccountId ?? undefined,
        toAccountId: payload.toAccountId ?? undefined,
        categoryId: payload.categoryId ?? undefined,
        amount: payload.amount,
        note: payload.note,
        tags: payload.tags,
      };
      setTransactions([tempTx, ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success('Transaction saved offline');
      setFormOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create transaction');
      const tx = keysToCamel<Transaction>(data);
      setTransactions([tx, ...transactions]);
      toast.success('Transaction created');
      setFormOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Sisipkan tombol Plus pada index ke-2 (0-based)
  const navWithPlus = [
    links[0],
    links[1],
    "PLUS", // marker untuk tombol tambah
    links[2],
    links[3],
  ] as const;

  return (
    <>
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 backdrop-blur-md sm:hidden",
        isDarkTheme
          ? "bg-card/90 shadow-lg shadow-black/10"
          : "bg-card/95 shadow-lg"
      )}
      >

        <div className="safe-area-bottom flex items-center justify-around px-2 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.2rem)' }}>
          {navWithPlus.map((item, idx) => {
            if (item === "PLUS") {
              return (
                <div className="relative -mt-4 z-10" key={`plus-${idx}`}>
                  <motion.button
                    onClick={handleAddTransaction}
                    aria-label="Add transaction"
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-full",
                      "bg-gradient-to-tr from-primary to-primary/80 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40",
                    )}
                  >
                    <Plus className="h-8 w-8 text-white" />
                    <span className="sr-only">Add transaction</span>
                  </motion.button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (pathname?.startsWith(item.href) && item.href !== "/");

            return (
              <div key={item.href} className="relative">
                {isActive && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-xl",
                      isDarkTheme ? "bg-primary/15" : "bg-primary/10"
                    )}
                    layoutId="activeNavBackground"
                  />
                )}
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "relative flex min-w-[70px] flex-col items-center justify-center rounded-xl p-2 transition-colors duration-200 touch-manipulation overflow-hidden",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary active:scale-95",
                  )}
                >

                  <Icon className={cn("mb-1 h-6 w-6 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  {/* <span className={cn("text-xs mt-1", isActive ? "font-medium" : "")}>{item.label}</span> */}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {formOpen && (
        <TransactionForm
          open={formOpen}
          transaction={transaction}
          accounts={accounts}
          categories={categories}
          onOpenChange={(open) => setFormOpen(open)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

export default MobileNav;
