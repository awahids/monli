'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { formatIDR } from '@/lib/currency';
import { PLAN_FEATURES, PRO_ORIGINAL_PRICE, PRO_PRICE } from '@/lib/plans';

gsap.registerPlugin(ScrollTrigger);

export function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const freeFeatures = PLAN_FEATURES.filter((f) => f.free !== false);
  const proFeatures = PLAN_FEATURES.filter((f) => f.pro !== false);
  const featureText = (label: string, value: string | boolean) =>
    typeof value === 'string' ? `${label} · ${value}` : label;
  const discount = Math.round(((PRO_ORIGINAL_PRICE - PRO_PRICE) / PRO_ORIGINAL_PRICE) * 100);

  return (
    <section id="pricing" ref={sectionRef} className="py-24">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="mb-2 text-3xl font-bold">Harga</h2>
        <p className="mb-8 text-muted-foreground">Mulai gratis, upgrade kalau butuh fitur lebih.</p>
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <Card className="pricing-card flex flex-col border-dashed shadow-none">
            <CardHeader className="text-center">
              <p className="text-sm font-medium text-muted-foreground">FREE</p>
              <CardTitle className="text-3xl font-bold">{formatIDR(0)}</CardTitle>
              <p className="text-sm text-muted-foreground">Gratis selamanya</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-left text-sm">
                {freeFeatures.map((f) => (
                  <li key={f.label} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {featureText(f.label, f.free)}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/auth/sign-up">Daftar gratis</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="pricing-card flex flex-col border-primary shadow-none">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-2">PRO</Badge>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">
                    {formatIDR(PRO_ORIGINAL_PRICE)}
                  </span>
                  <span className="text-sm font-medium text-green-600">-{discount}%</span>
                </div>
                <CardTitle className="text-3xl font-bold">{formatIDR(PRO_PRICE)}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">Harga promo · sekali bayar</p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2 text-left text-sm">
                {proFeatures.map((f) => (
                  <li key={f.label} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {featureText(f.label, f.pro)}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                asChild
                onClick={() => window.umami?.track('cta_pricing_click')}
              >
                <Link href="/auth/sign-up">Mulai sekarang</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
