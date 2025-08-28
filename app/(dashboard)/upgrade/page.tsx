'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatIDR } from '@/lib/currency';
import { useAppStore } from '@/lib/store';
import type { SnapResult } from '@/types/snap';

export default function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAppStore();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  // Discounted price for a limited time promotion
  const originalPrice = 50000;
  const price = 9000;

  useEffect(() => {
    const script = document.createElement('script');
    const snapUrl =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [clientKey]);

  async function handleUpgrade() {
    try {
      const res = await fetch('/api/upgrade', { method: 'POST' });
      if (!res.ok) {
        const { error } = await res.json();
        toast({ description: error || 'Failed to initiate payment', variant: 'destructive' });
        return;
      }
      const { token, orderId } = await res.json();
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async (result: SnapResult) => {
            await fetch(`/api/payments/${result.order_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'success' }),
            });
            toast({ description: 'Payment successful' });
            router.push(`/payments/${result.order_id}`);
          },
          onPending: async (result: SnapResult) => {
            await fetch(`/api/payments/${result.order_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'pending' }),
            });
            toast({ description: 'Payment pending' });
          },
          onError: async (result: SnapResult) => {
            await fetch(`/api/payments/${result.order_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed' }),
            });
            toast({ description: 'Payment failed', variant: 'destructive' });
          },
          onClose: async () => {
            await fetch(`/api/payments/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'canceled' }),
            });
            toast({ description: 'Payment popup closed', variant: 'destructive' });
          },
        });
      } else {
        toast({ description: 'Payment SDK not loaded', variant: 'destructive' });
      }
    } catch (e) {
      toast({
        description: (e as Error).message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  }

  if (!user) return null;

  if (user.plan === 'PRO') {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>You are already Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your account has been upgraded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upgrade to Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Unlock all features and get unlimited access to future updates.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Unlimited projects</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
            </ul>
          </div>
          <div className="rounded-md border p-4 space-y-2">
            <div className="text-sm font-medium">Order Summary</div>
            <div className="flex items-center justify-between text-sm">
              <span>Pro Plan Subscription</span>
              <span>
                <span className="mr-2 line-through text-muted-foreground">
                  {formatIDR(originalPrice)}
                </span>
                <span className="font-semibold text-primary">
                  {formatIDR(price)}
                </span>
              </span>
            </div>
          </div>
          <Button className="w-full" onClick={handleUpgrade}>
            Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
