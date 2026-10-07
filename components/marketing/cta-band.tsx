"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { track } from '@/lib/analytics';

/** Closing statement with one action, over a faint outline of the wordmark. */
export function CTABand() {
  return (
    <section aria-labelledby="cta-title" className="landing-grain relative overflow-hidden py-28 sm:py-40">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[28rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
      <p
        aria-hidden
        className="text-outline pointer-events-none absolute inset-x-0 bottom-0 translate-y-[58%] select-none opacity-70 text-center font-editorial text-[34vw] font-medium uppercase leading-none tracking-[-0.04em] lg:text-[22rem]"
      >
        {BRAND.product}
      </p>
      <div className="relative z-[2] mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Atur · Catat · Pahami
        </p>
        <h2
          id="cta-title"
          className="mt-6 font-editorial text-4xl font-normal leading-[1.05] tracking-[-0.02em] sm:text-6xl"
        >
          Mulai catat hari ini.
          <br />
          <span className="text-primary">Pahami bulan depan.</span>
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8 font-editorial text-base">
            <Link href="/auth/sign-up" onClick={() => track("cta_footer_signup")}>
              Mulai gratis <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full font-editorial text-base">
            <Link href="/auth/sign-in">Sudah punya akun? Masuk</Link>
          </Button>
        </div>
        <p className="mt-6 font-editorial text-xs text-muted-foreground">
          Tanpa kartu kredit · siap dalam 2 menit
        </p>
      </div>
    </section>
  );
}
