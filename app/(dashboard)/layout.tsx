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
import ChatWidget from "@/components/chat/chat-widget";

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

  // Children are rendered exactly once: the sidebar and bottom nav switch
  // with CSS breakpoints instead of duplicating the whole page tree.
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <Header />
        <main className="flex-1 space-y-4 p-4 pb-24 md:space-y-6 md:p-6">
          <OfflineBanner />
          {children}
        </main>
      </div>
      <MobileNav />
      <Toaster />
      <OnboardingTour />
      {user?.plan === 'PRO' && <ChatWidget />}
    </div>
  );
}
