"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Wallet, ReceiptText, LayoutDashboard, TrendingUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Accounts",
    description: "See balances in one view—bank, e-wallet, and cash.",
    icon: Wallet,
    image: "https://placehold.co/600x400/png?text=Accounts",
    color: "from-indigo-500 via-indigo-600 to-purple-500",
    bgPattern: "bg-gradient-to-br from-blue-50/80 to-cyan-50/40",
    darkBgPattern: "dark:from-blue-950/30 dark:to-cyan-950/20",
  },
  {
    title: "Budgets",
    description:
      "Plan per month per account. Allocate by category; roll over what matters.",
    icon: LayoutDashboard,
    image: "https://placehold.co/600x400/png?text=Budgets",
    color: "from-green-500 via-green-600 to-emerald-500",
    bgPattern: "bg-gradient-to-br from-green-50/80 to-emerald-50/40",
    darkBgPattern: "dark:from-green-950/30 dark:to-emerald-950/20",
  },
  {
    title: "Transactions",
    description: "Add expense, income, or transfer in seconds.",
    icon: ReceiptText,
    image: "https://placehold.co/600x400/png?text=Transactions",
    color: "from-purple-500 via-purple-600 to-violet-500",
    bgPattern: "bg-gradient-to-br from-purple-50/80 to-violet-50/40",
    darkBgPattern: "dark:from-purple-950/30 dark:to-violet-950/20",
  },
  {
    title: "Insights",
    description: "See spend vs. budget and trends.",
    icon: TrendingUp,
    image: "https://placehold.co/600x400/png?text=Insights",
    color: "from-orange-500 via-red-500 to-red-600",
    bgPattern: "bg-gradient-to-br from-orange-50/80 to-red-50/40",
    darkBgPattern: "dark:from-orange-950/30 dark:to-red-950/20",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
          },
        });

        const image = card.querySelector(".feature-image");
        if (image) {
          gsap.fromTo(
            image,
            { yPercent: 10 },
            {
              yPercent: -10,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-muted/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />

      {/* Floating background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full surface-elevated px-6 py-3 text-sm font-semibold mb-8 card-hover-glow">
            <div className="w-3 h-3 bg-gradient-primary rounded-full animate-pulse"></div>
            <span className="text-gradient-enhanced">Features that matter</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl mb-8 text-gradient-enhanced">
            Everything you need to manage your money
          </h2>
          <p className="text-xl text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Powerful features designed to help you take control of your finances
            and reach your goals faster than ever before.
          </p>
        </div>

        {/* Refactored Feature Grid */}
        <div className="grid gap-10 md:gap-12 md:grid-cols-2 lg:grid-cols-2 mt-20">
          {features.map((feature) => (
            <div key={feature.title} className="group relative feature-card">
              <div className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="aspect-video relative overflow-hidden rounded-xl mb-6">
                  <div
                    className={`absolute inset-0 ${feature.bgPattern} ${feature.darkBgPattern} opacity-80`}
                  />
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={600}
                    height={400}
                    className="feature-image object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg animate-float`}
                    >
                      <feature.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Bottom CTA */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-8 py-4 text-lg font-semibold text-primary backdrop-blur-sm hover:from-primary/15 hover:to-primary/10 transition-all duration-300 cursor-pointer group">
            <svg
              className="h-5 w-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Start using these features today
            <svg
              className="h-4 w-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
