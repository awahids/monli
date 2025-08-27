'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatIDR } from '@/lib/currency';
import type { SnapResult } from '@/types/snap';

export default function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const price = 50000;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
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

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upgrade to Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Unlock all features by upgrading to Pro.</p>
          <div className="space-y-1 text-sm">
            <div className="font-medium">Order Details</div>
            <div>Product: Pro Plan Subscription</div>
            <div>Price: {formatIDR(price)}</div>
          </div>
          <Button onClick={handleUpgrade}>Upgrade Now</Button>
        </CardContent>
      </Card>
    </div>
  );
}
