'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Account, Category, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { formatIDR, parseIDR } from '@/lib/currency';

export const getJakartaDate = () => {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
  return new Date(`${dateStr}T00:00:00+07:00`);
};

export const getCurrentMonth = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .slice(0, 7);

export const formSchema = z
  .object({
    budgetMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    actualDate: z.date(),
    type: z.enum(['expense', 'income', 'transfer']),
    accountId: z.string().optional(),
    fromAccountId: z.string().optional(),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    amount: z.coerce.number().positive(),
    note: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'expense' || data.type === 'income') {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountId'],
          message: 'Account is required',
        });
      }
    } else if (data.type === 'transfer') {
      if (!data.fromAccountId || !data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromAccountId'],
          message: 'From and To accounts are required',
        });
      } else if (data.fromAccountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toAccountId'],
          message: 'Accounts must differ',
        });
      }
      if (data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'Category not allowed for transfer',
        });
      }
    }
  });

// Use the inferred output type for consumers of the form
export type TransactionFormValues = z.infer<typeof formSchema>;

interface FieldsProps {
  form: UseFormReturn<z.input<typeof formSchema>, any, TransactionFormValues>;
  accounts: Account[];
  categories: Category[];
  contentRef: React.RefObject<HTMLDivElement> | null;
}

export function TransactionFields({
  form,
  accounts,
  categories,
  contentRef,
}: FieldsProps) {
  const currentType = form.watch('type');
  const [tagInput, setTagInput] = useState('');

  return (
    <>
      <FormField
        control={form.control}
        name="budgetMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget Month</FormLabel>
            <FormControl>
              <Input type="month" {...field} />
            </FormControl>
            <FormDescription>
              This decides which monthly budget the transaction belongs to.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="actualDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Actual Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? (
                      format(field.value, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              The real date it happened (for your timeline & receipts).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(val) => val && field.onChange(val)}
              className="grid grid-cols-3"
            >
              <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
              <ToggleGroupItem value="income">Income</ToggleGroupItem>
              <ToggleGroupItem value="transfer">Transfer</ToggleGroupItem>
            </ToggleGroup>
            <FormMessage />
          </FormItem>
        )}
      />

      {currentType !== 'transfer' ? (
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent container={contentRef?.current ?? undefined}>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent container={contentRef?.current ?? undefined}>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent container={contentRef?.current ?? undefined}>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {currentType !== 'transfer' && (
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent container={contentRef?.current ?? undefined}>
                  {categories
                    .filter((c) => c.type === currentType)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input
                inputMode="numeric"
                value={
                  typeof field.value === 'number' ? formatIDR(field.value) : ''
                }
                onChange={(e) => field.onChange(parseIDR(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {field.value?.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        field.onChange((field.value ?? []).filter((_, i) => i !== idx))
                      }
                    />
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim();
                      if (!field.value?.includes(newTag)) {
                        field.onChange([...(field.value || []), newTag]);
                      }
                      setTagInput('');
                    }
                  }}
                  className="flex-1 min-w-[120px]"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  id?: string;
  initialValues?: Partial<TransactionFormValues>;
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  onSubmit,
  onDelete,
  id,
  initialValues,
}: Props) {
  // react-hook-form's resolver expects the schema's input type, while the
  // submit handler uses the parsed output type. Specify both generics so the
  // form works with Zod's coercion (e.g. `z.coerce.number()`).
  const form = useForm<
    z.input<typeof formSchema>,
    any,
    TransactionFormValues
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetMonth: getCurrentMonth(),
      actualDate: getJakartaDate(),
      type: 'expense',
      accountId: undefined,
      fromAccountId: undefined,
      toAccountId: undefined,
      categoryId: undefined,
      amount: 0,
      note: '',
      tags: [],
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        budgetMonth: transaction.budgetMonth,
        actualDate: new Date(transaction.actualDate),
        type: transaction.type,
        accountId: transaction.accountId,
        fromAccountId: transaction.fromAccountId,
        toAccountId: transaction.toAccountId,
        categoryId: transaction.categoryId,
        amount: transaction.amount,
        note: transaction.note || '',
        tags: transaction.tags || [],
      });
    } else if (initialValues) {
      form.reset({
        budgetMonth: initialValues.budgetMonth ?? getCurrentMonth(),
        actualDate: initialValues.actualDate ?? getJakartaDate(),
        type: initialValues.type ?? 'expense',
        accountId: initialValues.accountId,
        fromAccountId: initialValues.fromAccountId,
        toAccountId: initialValues.toAccountId,
        categoryId: initialValues.categoryId,
        amount: initialValues.amount ?? 0,
        note: initialValues.note ?? '',
        tags: initialValues.tags ?? [],
      });
    } else {
      form.reset({
        budgetMonth: getCurrentMonth(),
        actualDate: getJakartaDate(),
        type: 'expense',
        amount: 0,
        note: '',
        tags: [],
      });
    }
  }, [transaction, initialValues, form]);

  const handleSubmit = async (values: TransactionFormValues) => {
    await onSubmit(values);
    form.reset({
      budgetMonth: getCurrentMonth(),
      actualDate: getJakartaDate(),
      type: 'expense',
      amount: 0,
      note: '',
      tags: [],
    });
  };

  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id={id}
        ref={contentRef}
        className="fixed top-auto bottom-0 left-0 right-0 w-full h-[90vh] overflow-y-auto p-0 rounded-t-xl sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-xl sm:p-6"
      >
        <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0">
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pb-24 px-4 sm:px-0"
          >
            <TransactionFields
              form={form}
              accounts={accounts}
              categories={categories}
              contentRef={contentRef}
            />

            <DialogFooter
              className="fixed sm:sticky bottom-0 left-0 right-0 flex justify-between gap-2 border-t bg-background px-4 py-4 z-10"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
            >
              {transaction && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete()}
                >
                  Delete
                </Button>
              )}
              <Button type="submit">
                {transaction ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionForm;