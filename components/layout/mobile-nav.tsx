"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Receipt, Plus, PieChart, Wallet } from "lucide-react";
import TransactionForm, {
  TransactionFormValues,
} from "@/components/transactions/transaction-form";
import type { Transaction } from "@/types";
import { useAppStore } from "@/lib/store";
import {
  refreshActiveAccounts,
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from "@/lib/transactions-client";
import { toast } from "sonner";
import { useOffline } from "@/hooks/use-offline";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const links = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/transactions", icon: Receipt, label: "Transaksi" },
  // index 2 akan diisi tombol Plus
  { href: "/budgets", icon: PieChart, label: "Budget" },
  { href: "/accounts", icon: Wallet, label: "Akun" },
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

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, user?.id || ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success('Disimpan offline, akan disinkronkan saat online');
      setFormOpen(false);
      return;
    }

    const tx = await saveTransaction(payload);
    setTransactions([tx, ...transactions]);
    // Keep balances on Dashboard/Accounts in sync with the new transaction.
    if (user) await refreshActiveAccounts(user.id);
    toast.success('Transaksi tersimpan');
    setFormOpen(false);
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
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 backdrop-blur-md md:hidden",
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
                    aria-label="Catat transaksi"
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-full",
                      "bg-gradient-to-tr from-primary to-primary/80 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40",
                    )}
                  >
                    <Plus className="h-8 w-8 text-white" />
                    <span className="sr-only">Catat transaksi</span>
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
                    "relative flex min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-1.5 transition-colors duration-200 touch-manipulation overflow-hidden",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary active:scale-95",
                  )}
                >

                  <Icon className={cn("mb-1 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[11px] leading-none", isActive ? "font-semibold" : "")}>{item.label}</span>
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
