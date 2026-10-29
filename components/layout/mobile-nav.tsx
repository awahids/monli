"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TransactionForm, {
  TransactionFormValues,
} from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QalaFamilyProducts } from "@/components/brand/qala-family";
import { KantoBuddy } from "@/components/brand/kanto";
import {
  AccountsIcon,
  AddIcon,
  ArisanIcon,
  BudgetIcon,
  ChallengeIcon,
  DebtIcon,
  GoalIcon,
  GuideIcon,
  HomeIcon,
  MoreIcon,
  NewsIcon,
  ReceiptIcon,
  RecurringIcon,
  ReportIcon,
  SettingsIcon,
  WrappedIcon,
  ZakatIcon,
} from "@/components/brand/saku-icons";
import { InstallCard } from "@/components/pwa/install-card";
import { openOnboarding } from "@/components/onboarding/onboarding";
import { useChangelogUnseen } from "@/lib/pwa";
import { useAppStore } from "@/lib/store";
import {
  ensureFormOptions,
  refreshActiveAccounts,
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from "@/lib/transactions-client";
import { READ_ONLY_MESSAGE } from "@/lib/space";
import { useOffline } from "@/hooks/use-offline";
import { useT } from '@/lib/i18n';
import { trialDaysLeft } from '@/lib/plans';

const tabs = [
  { href: "/dashboard", icon: HomeIcon, label: "Beranda", en: "Home" },
  { href: "/transactions", icon: ReceiptIcon, label: "Transaksi", en: "Transactions" },
  { href: "/budgets", icon: BudgetIcon, label: "Budget", en: "Budget" },
];

/** Everything without its own tab, shown as a grid under "Lainnya". */
const more = [
  { href: "/accounts", icon: AccountsIcon, label: "Akun", en: "Accounts" },
  { href: "/goals", icon: GoalIcon, label: "Target tabungan", en: "Savings goals" },
  { href: "/debts", icon: DebtIcon, label: "Hutang & piutang", en: "Debts" },
  { href: "/arisan", icon: ArisanIcon, label: "Arisan", en: "Arisan" },
  { href: "/challenges", icon: ChallengeIcon, label: "Tantangan hemat", en: "Challenges" },
  { href: "/recurring", icon: RecurringIcon, label: "Transaksi rutin", en: "Recurring" },
  { href: "/reports", icon: ReportIcon, label: "Laporan", en: "Reports" },
  { href: "/wrapped", icon: WrappedIcon, label: "Ringkasan tahunan", en: "Year in review" },
  { href: "/zakat", icon: ZakatIcon, label: "Zakat", en: "Zakat" },
  { href: "/settings", icon: SettingsIcon, label: "Pengaturan", en: "Settings" },
  { href: "/changelog", icon: NewsIcon, label: "Yang baru", en: "What's new" },
];

const isAt = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));

function TabLink({ href, icon: Icon, label, en, active }: (typeof tabs)[number] & { active: boolean }) {
  const { t } = useT();
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] leading-none transition-colors duration-200 touch-manipulation",
        active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="relative h-5 w-5" />
      <span className="relative">{t(label, en)}</span>
    </Link>
  );
}

/** Bottom tab bar with the add-transaction button in the middle. */
export function MobileNav() {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, space, accounts, categories, transactions, setTransactions } = useAppStore();
  const trialLeft = trialDaysLeft(user?.proUntil);
  const { isOnline, addOfflineChange } = useOffline();
  const changelogUnseen = useChangelogUnseen();
  const { t } = useT();
  const moreActive = more.some((m) => isAt(pathname, m.href)) || isAt(pathname, "/upgrade");

  const handleAddTransaction = () => {
    if (space && !space.canWrite) {
      toast.info(t(...READ_ONLY_MESSAGE));
      return;
    }
    if (user && isOnline) ensureFormOptions(space?.ownerId ?? user.id).catch(console.error);
    setFormOpen(true);
  };

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, space?.ownerId ?? user?.id ?? ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success(t('Disimpan offline, akan disinkronkan saat online', 'Saved offline, will sync when online'));
      setFormOpen(false);
      return;
    }

    // Saving bumps dataVersion, so the page underneath reloads its totals.
    await saveTransaction(payload);
    if (user) await refreshActiveAccounts(space?.ownerId ?? user.id);
    toast.success(t('Transaksi tersimpan', 'Transaction saved'));
    setFormOpen(false);
  };

  return (
    <>
      <nav
        aria-label={t("Navigasi utama", "Main navigation")}
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      >
        <div className="flex items-center gap-1 rounded-2xl border bg-card/95 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md dark:shadow-black/40">
          <TabLink {...tabs[0]} active={isAt(pathname, tabs[0].href)} />
          <TabLink {...tabs[1]} active={isAt(pathname, tabs[1].href)} />
          <button
            type="button"
            onClick={handleAddTransaction}
            aria-label={t("Catat transaksi", "Add transaction")}
            className="mx-1 -mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform hover:scale-110 active:scale-95"
          >
            <AddIcon className="h-7 w-7" />
          </button>
          <TabLink {...tabs[2]} active={isAt(pathname, tabs[2].href)} />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] leading-none transition-colors duration-200 touch-manipulation",
              moreActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreIcon className="relative h-5 w-5" />
            {changelogUnseen && (
              <span aria-label={t("Ada yang baru", "Something new")} className="absolute right-[calc(50%-14px)] top-1.5 h-2 w-2 rounded-full bg-brand-gold" />
            )}
            <span className="relative">{t("Lainnya", "More")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader className="flex-row items-center gap-3 space-y-0 text-left">
            <KantoBuddy className="h-12 w-12 shrink-0" />
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 grid grid-cols-4 gap-2">
            {more.map(({ href, icon: Icon, label, en }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isAt(pathname, href) ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center text-[11px] font-medium leading-tight transition-colors",
                    isAt(pathname, href) ? "border-primary/40 bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                    {href === "/changelog" && changelogUnseen && (
                      <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-brand-gold ring-2 ring-background">
                        <span className="sr-only">{t("Ada yang baru", "Something new")}</span>
                      </span>
                    )}
                  </span>
                  {t(label, en)}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  openOnboarding();
                }}
                className="flex h-full w-full flex-col items-center gap-2 rounded-xl border px-1 py-3 text-center text-[11px] font-medium leading-tight transition-colors hover:bg-muted"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <GuideIcon className="h-5 w-5" />
                </span>
                {t("Panduan", "Guide")}
              </button>
            </li>
          </ul>
          <InstallCard className="mt-4" />
          {/* PRO ending within two weeks (a trial, or a period about to run out) still shows the card;
              in the app it only warns, since the stores forbid pointing to web payments. */}
          {(user?.plan !== 'PRO' || (trialLeft !== null && trialLeft <= 14)) && (
            <div className={cn("mt-4 flex items-center gap-3 rounded-xl bg-muted/60 p-4", trialLeft === null && "web-only")}>
              <Sparkles className="h-5 w-5 shrink-0 text-brand-gold" />
              <div className="min-w-0 flex-1">
                {trialLeft !== null ? (
                  <>
                    <p className="text-sm font-medium">{t(`PRO: sisa ${trialLeft} hari`, `PRO: ${trialLeft} days left`)}</p>
                    <p className="web-only text-xs text-muted-foreground">{t("Perpanjang sebelum berakhir agar fitur PRO tetap aktif.", "Extend before it ends to keep PRO features.")}</p>
                    <p className="app-only text-xs text-muted-foreground">{t("Setelah itu akun kembali ke paket FREE.", "After that the account goes back to FREE.")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">{t("Coba Qala Saku PRO", "Try Qala Saku PRO")}</p>
                    <p className="text-xs text-muted-foreground">{t("Scan struk, asisten AI, laporan lengkap.", "Receipt scan, AI assistant, full reports.")}</p>
                  </>
                )}
              </div>
              <Button asChild size="sm" className="web-only">
                <Link href="/upgrade" onClick={() => setMoreOpen(false)}>{t("Lihat", "See")}</Link>
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
