"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

gsap.registerPlugin(ScrollTrigger);

type Feature = {
  title: string;
  tag: string;
  description: string;
  pro?: boolean;
  /** Frame of the promo film showing this part of the app. */
  image?: string;
  wide?: boolean;
};

const FEATURES: Feature[] = [
  {
    title: "Semua akun, satu saldo",
    tag: "Akun",
    description: "Rekening bank, e-wallet, dan tunai dalam satu layar. Saldo ikut bergerak setiap kali kamu mencatat.",
    image: "/landing/promo/lg/026.webp",
    wide: true,
  },
  {
    title: "Catat dalam detik",
    tag: "Transaksi",
    description: "Form singkat dengan saran tag dari riwayatmu. Foto struk dan biarkan Qala Saku membacanya.",
  },
  {
    title: "Budget ikut tanggal gajian",
    tag: "Budget",
    description: "Pilih tanggal mulai periode, misalnya tanggal 25. Sisa budget dan jatah harian dihitung otomatis.",
  },
  {
    title: "Transaksi rutin",
    tag: "Otomatis",
    description: "Gaji, kos, listrik, dan langganan tercatat sendiri setiap jatuh tempo.",
  },
  {
    title: "Target tabungan",
    tag: "Menabung",
    description: "Dana darurat atau liburan: lihat berapa yang perlu disisihkan tiap bulan agar tepat waktu.",
  },
  {
    title: "Laporan yang mudah dipahami",
    tag: "Laporan · AI",
    description: "Tren bulanan, pengeluaran per kategori, dan asisten AI yang menjawab pertanyaan tentang uangmu.",
    image: "/landing/promo/lg/086.webp",
    wide: true,
    pro: true,
  },
  {
    title: "Kelola bersama keluarga",
    tag: "Bersama",
    description: "Undang pasangan atau keluarga untuk mencatat dan memantau keuangan bersama, hingga 4 orang.",
    pro: true,
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        y: 32,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} aria-labelledby="features-title" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          index="02"
          kicker="Fitur"
          id="features-title"
          title="Semua yang kamu butuhkan untuk mengatur uang."
          description="Dirancang supaya mencatat keuangan terasa ringan: sedikit ketukan, gambaran yang jelas."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={cn(
                "feature-card group relative flex min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-primary/40",
                f.wide && "md:col-span-2 md:min-h-[20rem]"
              )}
            >
              {f.image && (
                <div aria-hidden className="absolute inset-y-0 right-0 hidden w-3/5 md:block">
                  <Image
                    src={f.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 40vw, 0px"
                    className="object-cover object-left opacity-80 transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0.55) 45%, transparent 100%)",
                    }}
                  />
                </div>
              )}
              <div className="relative flex items-center justify-between gap-3">
                <span className="font-editorial text-xs tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-2">
                  {f.pro && (
                    <span className="rounded-full border border-brand-gold/40 px-2 py-0.5 font-editorial text-[10px] font-medium uppercase tracking-[0.15em] text-brand-gold">
                      PRO
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-editorial text-[10px] uppercase tracking-[0.25em] text-muted-foreground",
                      f.image && "rounded-full bg-background/70 px-2.5 py-1 text-foreground/80 backdrop-blur"
                    )}
                  >
                    {f.tag}
                  </span>
                </span>
              </div>
              {f.image && (
                <div aria-hidden className="relative -mx-6 mt-5 aspect-[16/9] overflow-hidden md:hidden">
                  <Image src={f.image} alt="" fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
              )}
              <div className={cn("relative mt-auto pt-10", f.image && "pt-6 md:max-w-[48%] md:pt-10")}>
                <h3 className="font-editorial text-2xl font-normal leading-tight tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-3 font-editorial text-sm font-light leading-relaxed text-foreground/65">
                  {f.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
