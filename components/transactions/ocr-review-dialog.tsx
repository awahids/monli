'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import * as z from 'zod';

import {
  TransactionFields,
  formSchema,
  TransactionFormValues,
} from './transaction-form';
import { Account, Category } from '@/types';

export type OcrItem = { description: string; amount: number };

interface ItemFormProps {
  item: OcrItem;
  accounts: Account[];
  categories: Category[];
  date: Date;
  contentEl: HTMLDivElement | null;
}

export interface ItemFormHandle {
  getValues: () => TransactionFormValues;
}

const OcrItemForm = forwardRef<ItemFormHandle, ItemFormProps>(
  ({ item, accounts, categories, date, contentEl }, ref) => {
    const form = useForm<
      z.input<typeof formSchema>,
      any,
      TransactionFormValues
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        budgetMonth: format(date, 'yyyy-MM'),
        actualDate: date,
        type: 'expense',
        accountId: accounts[0]?.id,
        fromAccountId: undefined,
        toAccountId: undefined,
        categoryId: undefined,
        amount: item.amount,
        note: item.description,
        tags: [],
      },
    });

    useImperativeHandle(ref, () => ({ getValues: () => form.getValues() as TransactionFormValues }));

    return (
      <Form {...form}>
        <div className="space-y-4">
          <TransactionFields
            form={form}
            accounts={accounts}
            categories={categories}
            contentEl={contentEl}
          />
        </div>
      </Form>
    );
  }
);
OcrItemForm.displayName = 'OcrItemForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OcrItem[];
  accounts: Account[];
  categories: Category[];
  date: Date;
  onSave: (items: TransactionFormValues[]) => Promise<void>;
}

export default function OcrReviewDialog({
  open,
  onOpenChange,
  items,
  accounts,
  categories,
  date,
  onSave,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<ItemFormHandle[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  const handleSave = async () => {
    const values = itemRefs.current.map((ref) => ref.getValues());
    await onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl" ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Review Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 border rounded">
              <OcrItemForm
                ref={(el) => {
                  if (el) itemRefs.current[idx] = el;
                }}
                item={item}
                accounts={accounts}
                categories={categories}
                date={date}
                contentEl={contentRef.current}
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

