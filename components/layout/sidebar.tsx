"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  Package2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Accounts", href: "/accounts", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Zakat", href: "/zakat", icon: Package2 },
];

// Essential navigation for mobile (most used features)
const mobileNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Accounts", href: "/accounts", icon: CreditCard },
  // { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r border-border overflow-y-auto">
        <div className="px-3 py-4">
          <h2 className="text-xl font-bold text-foreground">Monli App</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personal Finance Manager
          </p>
        </div>

        <nav className="mt-6 flex-grow px-3 space-y-1">
          {navigation
            .filter((item) => item.name !== "Reports" || user?.plan === "PRO")
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {user?.plan !== 'PRO' && (
          <div className="mt-auto p-3">
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm font-medium">Upgrade Pro</p>
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href="/upgrade">Upgrade</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAppStore();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-lg hover:bg-primary/10 transition-all duration-200 touch-manipulation"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="px-3 py-4 border-b">
            <h2 className="text-xl font-bold text-foreground">Monli App</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Personal Finance Manager
            </p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-2">
            {mobileNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
                  )}
                >
                  <item.icon className="mr-4 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {user?.plan === 'PRO' && (
                <Link
                  href="/reports"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 touch-manipulation",
                    pathname === "/reports"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
                  )}
                >
                  <BarChart3 className="mr-4 h-5 w-5 flex-shrink-0" />
                  Reports
                </Link>
              )}

              <Link
                href="/zakat"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 touch-manipulation",
                  pathname === "/zakat"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
                )}
              >
                <Package2 className="mr-4 h-5 w-5 flex-shrink-0" />
                Zakat
              </Link>
            </div>

            {user?.plan !== 'PRO' && (
              <div className="mt-6 border-t border-border p-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-sm font-medium">Upgrade Pro</p>
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href="/upgrade" onClick={() => setOpen(false)}>
                      Upgrade
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
