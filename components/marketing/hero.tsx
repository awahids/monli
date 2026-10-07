"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

gsap.registerPlugin(ScrollTrigger);

/** Table of contents along the bottom of the hero, numbered like chapters. */
const CHAPTERS = [
  { n: "01", label: "Cerita", href: "#cerita" },
  { n: "02", label: "Fitur", href: "#features" },
  { n: "03", label: "Cara kerja", href: "#how-it-works" },
  { n: "04", label: "Harga", href: "#pricing" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-rise", { y: 28, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out" });
      gsap.from(".hero-word", { yPercent: 18, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.2 });
      // Slow parallax: the photo sinks and the wordmark lifts as the page scrolls.
      gsap.to(".hero-photo", {
        yPercent: 12,
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-word", {
        yPercent: -22,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="landing-grain relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden pt-16"
    >
      {/* Photo from the promo film, darkened into the ink background. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="hero-photo absolute inset-0">
          <Image
            src="/landing/hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] opacity-60 saturate-[0.85]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/60" />
        <div className="absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="relative z-[2] mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-8 pt-10 sm:px-6 sm:pt-16">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-xl">
            <a
              href={BRAND.familyUrl}
              target="_blank"
              rel="noreferrer"
              className="hero-rise inline-flex items-center gap-2 font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
              Keuangan pribadi · keluarga {BRAND.family}
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <h1
              id="hero-title"
              className="hero-rise mt-6 font-editorial text-[2.6rem] font-normal uppercase leading-[1.02] tracking-[-0.015em] sm:text-6xl lg:text-7xl"
            >
              Atur bulanan,
              <br />
              <span className="text-primary">catat harian.</span>
            </h1>
            <p className="hero-rise mt-6 max-w-md font-editorial text-base font-light leading-relaxed text-foreground/75 sm:text-lg">
              Pemasukan, pengeluaran, dan budget dari semua rekening dan e-wallet dalam satu tempat. Tahu persis ke
              mana uangmu pergi.
            </p>
            <div className="hero-rise mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7 font-editorial text-base">
                <Link href="/auth/sign-up" onClick={() => window.umami?.track("cta_hero_signup")}>
                  Mulai gratis <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-5 font-editorial text-base">
                <Link href="#cerita">Lihat cara kerjanya</Link>
              </Button>
            </div>
            <p className="hero-rise mt-5 font-editorial text-xs text-muted-foreground">
              Gratis selamanya · tanpa menyambungkan rekening bank
            </p>
          </div>

          <p
            aria-hidden
            className="hero-rise writing-vertical hidden font-editorial text-2xl font-light tracking-[0.2em] text-foreground/60 lg:block"
          >
            Atur · Catat · Pahami
          </p>
        </div>

        {/* Giant wordmark, fading into the ground like a horizon. */}
        <p
          aria-hidden
          className="hero-word pointer-events-none mt-auto select-none bg-gradient-to-b from-foreground/90 via-foreground/40 to-transparent bg-clip-text font-editorial text-[30vw] font-medium uppercase leading-[0.8] tracking-[-0.04em] text-transparent sm:text-[24vw] lg:text-[19rem]"
        >
          {BRAND.product}
        </p>

        <div className="-mt-6 flex flex-col gap-6 border-t border-white/10 pt-5 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
          <nav aria-label="Daftar isi">
            <p className="mb-3 font-editorial text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Jelajahi</p>
            <ol className="flex gap-6 sm:gap-10">
              {CHAPTERS.map((c) => (
                <li key={c.n}>
                  <Link href={c.href} className="group block">
                    <span className="block font-editorial text-3xl font-light tabular-nums text-foreground/85 transition-colors group-hover:text-primary sm:text-4xl">
                      {c.n}
                    </span>
                    <span className="mt-1 block font-editorial text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">
                      {c.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <Link
            href="#cerita"
            className="group flex items-center gap-4 self-start rounded-xl border border-white/10 bg-background/50 p-2 pr-5 backdrop-blur-md transition-colors hover:border-primary/40 sm:self-auto"
          >
            <span className="relative block h-16 w-28 overflow-hidden rounded-lg">
              <Image src="/landing/promo/sm/061.webp" alt="" fill sizes="112px" className="object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-background transition-transform group-hover:scale-110">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                </span>
              </span>
            </span>
            <span>
              <span className="block font-editorial text-sm">Lihat Qala Saku beraksi</span>
              <span className="block font-editorial text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Video · 10 detik
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
