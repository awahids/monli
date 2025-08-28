'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { formatIDR } from '@/lib/currency';

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="mb-8 text-3xl font-bold">Pricing</h2>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card className="border-dashed shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">{formatIDR(0)}</CardTitle>
              <p className="text-sm text-muted-foreground">Free plan</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-left">
                <li>1 account</li>
                <li>Up to 2 budgets</li>
                <li>Manual transactions</li>
                <li>No reports</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-2">Pro</Badge>
              <CardTitle className="text-3xl font-bold">{formatIDR(9000)}</CardTitle>
              <p className="text-sm text-muted-foreground">per month promo</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-left">
                <li>Unlimited accounts</li>
                <li>Unlimited budgets</li>
                <li>Receipt OCR scanning</li>
                <li>Category reports</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                asChild
                onClick={() => window.umami?.track('cta_pricing_click')}
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
