'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, Category } from '@/types';

export type OcrItem = { description: string; amount: number; };

export interface ReviewItem extends OcrItem {
  accountId?: string;
  categoryId?: string;
  note?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OcrItem[];
  accounts: Account[];
  categories: Category[];
  onSave: (items: ReviewItem[]) => Promise<void>;
}

export default function OcrReviewDialog({
  open,
  onOpenChange,
  items,
  accounts,
  categories,
  onSave,
}: Props) {
  const [rows, setRows] = useState<ReviewItem[]>([]);

  useEffect(() => {
    setRows(
      items.map((it) => ({
        description: it.description,
        amount: it.amount,
        accountId: accounts[0]?.id,
        categoryId: undefined,
        note: '',
      }))
    );
  }, [items, accounts]);

  const updateRow = (index: number, field: keyof ReviewItem, value: any) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    await onSave(rows);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <Input
                value={row.description}
                onChange={(e) => updateRow(idx, 'description', e.target.value)}
                placeholder="Description"
                className="md:col-span-2"
              />
              <Input
                type="number"
                value={row.amount}
                onChange={(e) => updateRow(idx, 'amount', Number(e.target.value))}
                placeholder="Amount"
              />
              <Select
                value={row.accountId || ''}
                onValueChange={(val) => updateRow(idx, 'accountId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.categoryId || ''}
                onValueChange={(val) => updateRow(idx, 'categoryId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={row.note || ''}
                onChange={(e) => updateRow(idx, 'note', e.target.value)}
                placeholder="Note"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Transactions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

