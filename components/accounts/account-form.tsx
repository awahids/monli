'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Account } from '@/types';
import { CURRENCIES } from '@/lib/currency';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';
import { useT } from '@/lib/i18n';

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Nama akun wajib diisi'),
  type: z.enum(['bank', 'ewallet', 'cash']),
  currency: z.enum(['IDR', 'USD', 'EUR']),
  accountNumber: z.string().optional(),
  openingBalance: z.number().min(0, 'Saldo awal tidak boleh negatif'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  account?: Account;
  onSuccess?: () => void;
}

// Goes through /api/accounts so the server sets current_balance and enforces
// the FREE plan's account limit (writing to Supabase directly skipped both).
export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const { t } = useT();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'bank',
      currency: (account?.currency as AccountFormValues['currency']) ?? 'IDR',
      accountNumber: account?.accountNumber ?? '',
      openingBalance: account?.openingBalance ?? 0,
    },
  });
  const { isSubmitting } = form.formState;
  const currency = form.watch('currency');
  const type = form.watch('type');

  const onSubmit = async (values: AccountFormValues) => {
    const res = await fetch(account ? `/api/accounts/${account.id}` : '/api/accounts', {
      method: account ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        type: values.type,
        currency: values.currency,
        openingBalance: values.openingBalance,
        accountNumber: values.accountNumber ?? '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        res.status === 403
          ? t('Paket FREE hanya bisa punya 1 akun. Upgrade ke PRO untuk menambah akun.', 'The FREE plan can have only 1 account. Upgrade to PRO to add more.')
          : data.error || t('Gagal menyimpan akun', 'Could not save the account')
      );
      return;
    }
    toast.success(account ? t('Akun diperbarui', 'Account updated') : t('Akun dibuat', 'Account created'));
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Nama akun', 'Account name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('mis. BCA, GoPay, Dompet', 'e.g. Chase, PayPal, Wallet')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Jenis', 'Type')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="ewallet">E-wallet</SelectItem>
                    <SelectItem value="cash">{t('Tunai', 'Cash')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Mata uang', 'Currency')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Saldo awal', 'Opening balance')}</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  currency={currency}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'Saldo saat akun ini mulai dicatat. Saldo sekarang dihitung dari saldo awal ditambah semua transaksi.',
                  'The balance when you start tracking this account. The current balance is the opening balance plus all transactions.'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {type !== 'cash' && (
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Nomor rekening (opsional)', 'Account number (optional)')}</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div
          className="sticky bottom-0 border-t bg-background pt-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('Menyimpan...', 'Saving...') : account ? t('Simpan perubahan', 'Save changes') : t('Buat akun', 'Create account')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AccountForm;
