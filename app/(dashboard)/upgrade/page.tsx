'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function UpgradePage() {
  const { toast } = useToast();
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

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
      const { token } = await res.json();
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => toast({ description: 'Payment successful' }),
          onPending: () => toast({ description: 'Payment pending' }),
          onError: () =>
            toast({ description: 'Payment failed', variant: 'destructive' }),
          onClose: () =>
            toast({ description: 'Payment popup closed', variant: 'destructive' }),
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
          <Button onClick={handleUpgrade}>Upgrade Now</Button>
        </CardContent>
      </Card>
    </div>
  );
}
