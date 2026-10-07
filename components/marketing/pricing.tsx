'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/currency';
import { PLAN_FEATURES, PRO_ORIGINAL_PRICE, PRO_PRICE } from '@/lib/plans';
import { SectionHeading } from './section-heading';
import { track } from '@/lib/analytics';

const valueText = (value: string | boolean) => (typeof value === 'string' ? value : value ? 'Termasuk' : '');

export function Pricing() {
  const discount = Math.round(((PRO_ORIGINAL_PRICE - PRO_PRICE) / PRO_ORIGINAL_PRICE) * 100);

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          index="04"
          kicker="Harga"
          id="pricing-title"
          title="Mulai gratis. Upgrade kalau perlu."
          description="Paket FREE gratis selamanya. PRO cukup sekali bayar, tanpa langganan."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {/* FREE */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="font-editorial text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Free</p>
            <p className="mt-4 font-editorial text-5xl font-light tabular-nums">{formatIDR(0)}</p>
            <p className="mt-1 font-editorial text-sm text-muted-foreground">Gratis selamanya</p>
            <ul className="mt-8 flex-1 divide-y divide-white/5 border-t border-white/10">
              {PLAN_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-4 py-2.5 font-editorial text-sm">
                  <span className={f.free === false ? 'text-foreground/35' : 'text-foreground/80'}>{f.label}</span>
                  {f.free === false ? (
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-foreground/25" aria-label="Tidak termasuk" />
                  ) : Array.isArray(f.free) ? (
                    <span className="shrink-0 text-muted-foreground">{f.free[0]}</span>
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Termasuk" />
                  )}
                </li>
              ))}
            </ul>
            <Button variant="outline" asChild className="mt-8 rounded-full border-white/15 bg-transparent font-editorial">
              <Link href="/auth/sign-up">Daftar gratis</Link>
            </Button>
          </div>

          {/* PRO */}
          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/50 bg-primary/[0.06] p-6 sm:p-8">
            <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-[100px]" />
            <div className="relative flex items-center justify-between">
              <p className="font-editorial text-[11px] uppercase tracking-[0.25em] text-primary">Pro</p>
              <span className="rounded-full bg-brand-gold/15 px-2.5 py-1 font-editorial text-[11px] font-medium text-brand-gold">
                Hemat {discount}%
              </span>
            </div>
            <div className="relative mt-4 flex items-baseline gap-3">
              <p className="font-editorial text-5xl font-light tabular-nums">{formatIDR(PRO_PRICE)}</p>
              <p className="font-editorial text-base text-muted-foreground line-through">{formatIDR(PRO_ORIGINAL_PRICE)}</p>
            </div>
            <p className="relative mt-1 font-editorial text-sm text-muted-foreground">Harga promo · sekali bayar</p>
            <ul className="relative mt-8 flex-1 divide-y divide-white/5 border-t border-white/10">
              {PLAN_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-4 py-2.5 font-editorial text-sm">
                  <span className="text-foreground/85">{f.label}</span>
                  {Array.isArray(f.pro) ? (
                    <span className="shrink-0 text-primary">{valueText(f.pro[0])}</span>
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Termasuk" />
                  )}
                </li>
              ))}
            </ul>
            <Button asChild className="relative mt-8 rounded-full font-editorial">
              <Link href="/auth/sign-up" onClick={() => track('cta_pricing_click')}>
                Mulai sekarang
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
