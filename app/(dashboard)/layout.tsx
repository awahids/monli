"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAppStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user) return;
    (async () => {
      const current = await getCurrentUser();
      if (current) {
        setUser(current);
      } else {
        router.push("/auth/sign-in");
      }
    })();
  }, [user, setUser, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <Header />
        <main className="p-4 pb-20 space-y-4">
          <OfflineBanner />
          {children}
        </main>
        <MobileNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <div
          className={cn(
            "flex-1 transition-all", 
            sidebarCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
          <Header />
          <main className="p-6 space-y-6">
            <OfflineBanner />
            {children}
          </main>
        </div>
      </div>
      <Toaster />
      <OnboardingTour />
    </div>
  );
}