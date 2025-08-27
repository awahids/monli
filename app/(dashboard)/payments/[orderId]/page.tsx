'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatIDR } from '@/lib/currency';
import { Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payments/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data.payment);
      }
    })();
  }, [orderId]);

  if (!payment) return <div>Loading...</div>;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Order {payment.orderId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>Product: {payment.productName}</div>
        <div>Amount: {formatIDR(payment.amount)}</div>
        <div>
          Status:{' '}
          <Badge
            variant={
              payment.status === 'success'
                ? 'default'
                : payment.status === 'pending'
                ? 'secondary'
                : 'destructive'
            }
          >
            {payment.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
