'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { categorySchema } from '@/lib/validation';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { IconPicker } from './icon-picker';
import { cn } from '@/lib/utils';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#14A7A0', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'];

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryFormDialog({ open, onOpenChange, initialData, onSubmit }: Props) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      type: initialData?.type ?? 'expense',
      color: initialData?.color ?? COLORS[3],
      icon: initialData?.icon ?? 'ShoppingBag',
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? '',
      type: initialData?.type ?? 'expense',
      color: initialData?.color ?? COLORS[3],
      icon: initialData?.icon ?? 'ShoppingBag',
    });
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={initialData ? 'Edit kategori' : 'Tambah kategori'}
        className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6"
      >
        <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle>{initialData ? 'Edit kategori' : 'Tambah kategori'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (v) => {
              await onSubmit(v);
              onOpenChange(false);
            })}
            className="space-y-4 px-4 pb-24 sm:px-0 sm:pb-0"
          >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="expense">Pengeluaran</ToggleGroupItem>
                      <ToggleGroupItem value="income">Pemasukan</ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warna</FormLabel>
                  <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Warna">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={field.value === c}
                        aria-label={`Warna ${c}`}
                        onClick={() => field.onChange(c)}
                        className={cn(
                          'h-8 w-8 rounded-full ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          field.value === c && 'ring-2 ring-foreground'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    {/* Native picker hidden under a swatch: rainbow until a custom colour is chosen. */}
                    <label
                      title="Warna lain"
                      className={cn(
                        'relative h-8 w-8 cursor-pointer rounded-full ring-offset-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring',
                        field.value && !COLORS.includes(field.value) && 'ring-2 ring-foreground'
                      )}
                      style={{
                        background:
                          field.value && !COLORS.includes(field.value)
                            ? field.value
                            : 'conic-gradient(#ef4444, #f59e0b, #22c55e, #14A7A0, #3b82f6, #a855f7, #ec4899, #ef4444)',
                      }}
                    >
                      <FormControl>
                        <input
                          type="color"
                          aria-label="Warna lain"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          {...field}
                        />
                      </FormControl>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ikon</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} color={form.watch('color')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter
              className="sticky bottom-0 justify-end gap-2 border-t bg-background px-4 py-4"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
