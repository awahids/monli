'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
import { useT } from '@/lib/i18n';

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
        accountId: item.accountId ?? accounts[0]?.id,
        fromAccountId: undefined,
        toAccountId: undefined,
        categoryId: item.categoryId,
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
  title?: string;
}

export default function OcrReviewDialog({
  open,
  onOpenChange,
  items,
  accounts,
  categories,
  date,
  onSave,
  title,
}: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { t } = useT();
  const itemRefs = useRef<Map<number, ItemFormHandle>>(new Map());
  // Items the user removed (a wrong or duplicate entry), by index in `items`.
  const [removed, setRemoved] = useState<Set<number>>(new Set());

  useEffect(() => {
    itemRefs.current.clear();
    setRemoved(new Set());
  }, [items, open]);

  const kept = items.map((item, idx) => ({ item, idx })).filter(({ idx }) => !removed.has(idx));

  const removeItem = (idx: number) => {
    itemRefs.current.delete(idx);
    setRemoved((prev) => new Set(prev).add(idx));
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const results = await Promise.all(kept.map(({ idx }) => itemRefs.current.get(idx)!.validate()));
    if (results.some((r) => r === null)) {
      toast.error(t('Lengkapi dulu item yang ditandai merah', 'Complete the items marked in red first'));
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
          <DialogTitle>
            {title ?? t('Periksa hasil scan struk', 'Review scanned receipt')} ({t(`${kept.length} item`, `${kept.length} items`)})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {kept.map(({ item, idx }, pos) => (
            <div key={idx} className="p-4 border rounded">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t(`Item ${pos + 1}`, `Item ${pos + 1}`)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(idx)}
                  aria-label={t(`Hapus item ${pos + 1}`, `Remove item ${pos + 1}`)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <OcrItemForm
                ref={(el) => {
                  if (el) itemRefs.current.set(idx, el);
                }}
                item={item}
                accounts={accounts}
                categories={categories}
                date={date}
                contentEl={contentRef.current}
              />
            </div>
          ))}
          {kept.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('Semua item dihapus, tidak ada yang disimpan.', 'All items removed, nothing to save.')}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || kept.length === 0}>
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan semua', 'Save all')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

