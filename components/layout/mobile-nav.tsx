"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  CreditCard,
  Home,
  LayoutGrid,
  Package2,
  PieChart,
  Plus,
  Receipt,
  Repeat,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TransactionForm, {
  TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QalaFamilyProducts } from "@/components/brand/qala-family";
import { useAppStore } from "@/lib/store";
import {
  refreshActiveAccounts,
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from "@/lib/transactions-client";
import { READ_ONLY_MESSAGE } from "@/lib/space";
import { useOffline } from "@/hooks/use-offline";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Beranda" },
  { href: "/transactions", icon: Receipt, label: "Transaksi" },
  { href: "/budgets", icon: PieChart, label: "Budget" },
];

/** Everything without its own tab, shown as a grid under "Lainnya". */
const more = [
  { href: "/accounts", icon: CreditCard, label: "Akun" },
  { href: "/goals", icon: Target, label: "Target tabungan" },
  { href: "/recurring", icon: Repeat, label: "Transaksi rutin" },
  { href: "/reports", icon: BarChart3, label: "Laporan" },
  { href: "/zakat", icon: Package2, label: "Zakat" },
  { href: "/settings", icon: Settings, label: "Pengaturan" },
];

const isAt = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));

function TabLink({ href, icon: Icon, label, active }: (typeof tabs)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] leading-none transition-colors touch-manipulation",
        active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-primary/10"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative h-5 w-5" />
      <span className="relative">{label}</span>
    </Link>
  );
}

/** Bottom tab bar with the add-transaction button in the middle. */
export function MobileNav() {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, space, accounts, categories, transactions, setTransactions } = useAppStore();
  const { isOnline, addOfflineChange } = useOffline();
  const moreActive = more.some((m) => isAt(pathname, m.href)) || isAt(pathname, "/upgrade");

  const handleAddTransaction = () => {
    if (space && !space.canWrite) {
      toast.info(READ_ONLY_MESSAGE);
      return;
    }
    setFormOpen(true);
  };

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, space?.ownerId ?? user?.id ?? ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success('Disimpan offline, akan disinkronkan saat online');
      setFormOpen(false);
      return;
    }

    const tx = await saveTransaction(payload);
    setTransactions([tx, ...transactions]);
    // Keep balances on Dashboard/Accounts in sync with the new transaction.
    if (user) await refreshActiveAccounts(space?.ownerId ?? user.id);
    toast.success('Transaksi tersimpan');
    setFormOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      >
        <div className="flex items-center gap-1 rounded-2xl border bg-card/95 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md dark:shadow-black/40">
          <TabLink {...tabs[0]} active={isAt(pathname, tabs[0].href)} />
          <TabLink {...tabs[1]} active={isAt(pathname, tabs[1].href)} />
          <motion.button
            type="button"
            onClick={handleAddTransaction}
            whileTap={{ scale: 0.92 }}
            aria-label="Catat transaksi"
            className="mx-1 -mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background focus:outline-none focus-visible:ring-primary/40"
          >
            <Plus className="h-7 w-7" />
          </motion.button>
          <TabLink {...tabs[2]} active={isAt(pathname, tabs[2].href)} />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] leading-none transition-colors touch-manipulation",
              moreActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {moreActive && (
              <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-primary/10" />
            )}
            <LayoutGrid className="relative h-5 w-5" />
            <span className="relative">Lainnya</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {more.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isAt(pathname, href) ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-medium transition-colors",
                    isAt(pathname, href) ? "border-primary/40 bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          {user?.plan !== 'PRO' && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/60 p-4">
              <Sparkles className="h-5 w-5 shrink-0 text-brand-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Coba Qala Saku PRO</p>
                <p className="text-xs text-muted-foreground">Scan struk, asisten AI, laporan lengkap.</p>
              </div>
              <Button asChild size="sm">
                <Link href="/upgrade" onClick={() => setMoreOpen(false)}>Lihat</Link>
              </Button>
            </div>
          )}
          <QalaFamilyProducts className="mt-4 border-t pt-4" />
        </SheetContent>
      </Sheet>

      {formOpen && (
        <TransactionForm
          open={formOpen}
          accounts={accounts}
          categories={categories}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

export default MobileNav;
