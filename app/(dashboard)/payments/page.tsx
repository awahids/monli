'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatIDR } from '@/lib/currency';
import { Payment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`/payments/${p.orderId}`} className="underline">
                  {p.orderId}
                </Link>
              </TableCell>
              <TableCell>{p.productName}</TableCell>
              <TableCell>{formatIDR(p.amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    p.status === 'success'
                      ? 'default'
                      : p.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {p.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
