"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "./section-heading";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Buat akun",
    description: "Daftar gratis dengan Google atau email. Kategori dasar langsung disiapkan.",
  },
  {
    title: "Tambah rekening",
    description: "Masukkan rekening bank, e-wallet, atau tunai beserta saldonya hari ini.",
  },
  {
    title: "Catat & atur budget",
    description: "Catat transaksi setiap hari, lalu lihat sisa budget dan jatah harianmu.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".step", {
        y: 32,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} aria-labelledby="how-title" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          index="03"
          kicker="Cara kerja"
          id="how-title"
          title="Tiga langkah, lima menit."
          description="Tidak perlu menyambungkan bank. Mulai dari saldo hari ini."
        />
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step md:px-8 md:first:pl-0 md:last:pr-0">
              <span aria-hidden className="text-outline block font-editorial text-8xl font-light leading-none tabular-nums [-webkit-text-stroke:1px_hsl(var(--primary)/0.6)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-editorial text-2xl font-normal">{s.title}</h3>
              <p className="mt-2 max-w-xs font-editorial text-sm font-light leading-relaxed text-foreground/65">
                {s.description}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/auth/sign-up"
          className="group mt-14 inline-flex items-center gap-3 font-editorial text-sm uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground"
        >
          <span className="h-px w-10 bg-primary transition-all group-hover:w-16" />
          Siap mulai
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
