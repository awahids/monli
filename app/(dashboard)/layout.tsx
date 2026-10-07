"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAppStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SpaceBanner } from "@/components/layout/space-switcher";
import ChatWidget from "@/components/chat/chat-widget";
import { UpdateBanner } from "@/components/pwa/update-banner";
import { OnboardingGate } from "@/components/onboarding/onboarding";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAppStore();

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

  // The app is a phone-sized column on every screen, like a mobile app;
  // wider screens just get a backdrop around it.
  return (
    <div className="min-h-screen bg-muted/60 dark:bg-black">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background sm:border-x sm:shadow-xl">
        <Header />
        <main className="flex-1 space-y-4 px-4 pb-32 pt-2">
          <UpdateBanner />
          <OfflineBanner />
          <SpaceBanner />
          {children}
        </main>
      </div>
      <MobileNav />
      <Toaster position="top-center" />
      {user?.plan === 'PRO' && <ChatWidget />}
      <OnboardingGate />
    </div>
  );
}
