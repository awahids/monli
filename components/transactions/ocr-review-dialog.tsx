'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  TransactionFields,
  formSchema,
  TransactionFormValues,
} from './transaction-form';
import { Account, Category } from '@/types';
import { defaultBudgetMonth } from '@/lib/budget-period';
import type { OcrItem } from '@/lib/ocr';

interface ItemFormProps {
  item: OcrItem;
  accounts: Account[];
  categories: Category[];
  date: Date;
  contentEl: HTMLDivElement | null;
}

export interface ItemFormHandle {
  /** Validates the item; resolves to its parsed values, or null if invalid. */
  validate: () => Promise<TransactionFormValues | null>;
}

const OcrItemForm = forwardRef<ItemFormHandle, ItemFormProps>(
  ({ item, accounts, categories, date: scanDate, contentEl }, ref) => {
    // Rows of a bank history carry their own date; receipts use the scan date.
    const date = item.date ? new Date(`${item.date}T00:00:00+07:00`) : scanDate;
    const form = useForm<
      z.input<typeof formSchema>,
      any,
      TransactionFormValues
    >({
      resolver: zodResolver(formSchema),
      defaultValues: {
        budgetMonth: defaultBudgetMonth(date),
        actualDate: date,
        type: item.type ?? 'expense',
        accountId: accounts[0]?.id,
        fromAccountId: undefined,
        toAccountId: undefined,
        categoryId: undefined,
        amount: item.amount,
        note: item.description,
        tags: [],
      },
    });

    // Accounts may arrive after the dialog opened (e.g. right after a reload).
    useEffect(() => {
      if (!form.getValues('accountId') && accounts[0]) form.setValue('accountId', accounts[0].id, { shouldValidate: true });
    }, [accounts, form]);

    useImperativeHandle(ref, () => ({
      validate: async () =>
        (await form.trigger())
          ? (formSchema.parse(form.getValues()) as TransactionFormValues)
          : null,
    }));

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

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const results = await Promise.all(itemRefs.current.map((ref) => ref.validate()));
    if (results.some((r) => r === null)) {
      toast.error('Lengkapi dulu item yang ditandai merah');
      return;
    }
    setSaving(true);
    try {
      await onSave(results as TransactionFormValues[]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Periksa hasil scan struk ({items.length} item)</DialogTitle>
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan semua'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

