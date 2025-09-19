"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

import { Button } from "@/components/ui/button";

const accountCards = [
  {
    name: "Main Wallet",
    balance: "Rp 12.500.000",
    label: "Spending",
    accent: "from-primary/80 to-primary",
    style: {
      transform: "rotate(-16deg) translateY(32px) scale(0.9)",
      zIndex: 5,
      opacity: 0.65,
    },
    icon: "💳",
  },
  {
    name: "Bills Reserve",
    balance: "Rp 6.200.000",
    label: "Essentials",
    accent: "from-blue-500/60 to-blue-500",
    style: {
      transform: "rotate(-8deg) translateY(16px) scale(0.95)",
      zIndex: 10,
      opacity: 0.8,
    },
    icon: "📦",
  },
  {
    name: "Family Budget",
    balance: "Rp 9.850.000",
    label: "Shared",
    accent: "from-amber-500/70 to-amber-500",
    style: {
      transform: "translateY(0px) scale(1)",
      zIndex: 20,
      opacity: 1,
    },
    icon: "🏠",
  },
  {
    name: "Travel Fund",
    balance: "Rp 3.400.000",
    label: "Savings",
    accent: "from-emerald-500/70 to-emerald-500",
    style: {
      transform: "rotate(8deg) translateY(16px) scale(0.95)",
      zIndex: 10,
      opacity: 0.8,
    },
    icon: "🧳",
  },
  {
    name: "Dream Projects",
    balance: "Rp 2.250.000",
    label: "Goals",
    accent: "from-purple-500/70 to-purple-500",
    style: {
      transform: "rotate(16deg) translateY(32px) scale(0.9)",
      zIndex: 5,
      opacity: 0.65,
    },
    icon: "✨",
  },
];

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(TextPlugin);

    const ctx = gsap.context(() => {
      gsap.from(".hero-animate", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out",
      });

      if (trackRef.current) {
        const finalText = trackRef.current.textContent || "";
        gsap.fromTo(
          trackRef.current,
          { text: "" },
          { text: finalText, duration: 1.2, ease: "power2.out" },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-12 sm:py-20 lg:py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,hsl(var(--primary)/0.1),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/40 to-transparent" />

      <div className="absolute inset-x-0 top-20 flex justify-center opacity-20">
        <div className="h-40 w-[36rem] rounded-full bg-gradient-to-r from-primary/60 via-primary/20 to-primary/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/60 p-8 shadow-[0_40px_120px_-40px_hsl(var(--primary)/0.35)] backdrop-blur-xl sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -inset-px rounded-[2.5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent" />

          <div className="relative">
            <div className="hero-animate flex items-center justify-between gap-4 pb-12">
              <div className="flex flex-1 justify-center gap-3">
                {["Dashboard", "Budgets", "Insights"].map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-full border px-4 py-1 text-sm font-semibold transition-colors ${
                      index === 0
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="hidden shrink-0 text-primary sm:flex">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3l1.77 3.59 3.98.58-2.88 2.81.68 3.95L12 12.97l-3.55 1.96.68-3.95-2.88-2.81 3.98-.58L12 3z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="hero-animate mx-auto max-w-3xl text-center">
              <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Financial clarity in one orbit
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Keep every account in sync,
                <span
                  ref={trackRef}
                  className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
                >
                  every single day.
                </span>
              </h1>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="h-2 w-48 rounded-full bg-primary/40 sm:w-40" />
                <div className="h-2 w-24 rounded-full bg-white/10 sm:w-32" />
                <div className="h-2 w-16 rounded-full bg-white/10 sm:w-24" />
              </div>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
                Plan your month, track your daily spending, and see how each account contributes to your goals without juggling spreadsheets.
              </p>
            </div>

            <div className="hero-animate mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="group relative rounded-2xl px-10 py-5 text-base font-semibold shadow-lg shadow-primary/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30"
              >
                <Link href="/auth/sign-up" className="flex items-center gap-2">
                  Start free trial
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12h14m0 0l-6-6m6 6l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border-white/20 bg-white/5 px-10 py-5 text-base font-semibold text-foreground transition-transform duration-300 hover:-translate-y-1 hover:border-primary/40 hover:text-primary"
              >
                <Link href="#features">Explore how it works</Link>
              </Button>
            </div>

            <div className="hero-animate mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Zero bank passwords needed
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                End-to-end encryption
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
                Always free for individuals
              </div>
            </div>
          </div>

          <div className="hero-animate relative mt-20">
            <div className="pointer-events-none absolute inset-x-12 -top-12 h-32 rounded-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 blur-3xl" />
            <div className="flex flex-col items-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Your accounts
              </div>
              <div className="relative flex items-end justify-center gap-4 sm:gap-6">
                {accountCards.map((card) => (
                  <div
                    key={card.name}
                    className="relative w-44 shrink-0 rounded-[1.75rem] border border-white/10 bg-background/80 p-5 text-left backdrop-blur-xl transition-transform duration-300 hover:z-30 hover:-translate-y-3 hover:scale-105 sm:w-52"
                    style={card.style}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{card.label}</span>
                      <span>{card.icon}</span>
                    </div>
                    <p className="mt-5 text-lg font-semibold text-foreground">{card.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold text-foreground">{card.balance}</p>
                    <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${card.accent}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
