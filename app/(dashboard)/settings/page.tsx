'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileSchema } from '@/lib/validation';
import { Category } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { CategoryFormDialog, CategoryFormValues } from '@/components/settings/category-form-dialog';
import { SharedSpaceCard } from '@/components/settings/shared-space-card';
import { AboutAppCard } from '@/components/settings/about-app-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/transactions/category-icon';
import { AppLockCard } from '@/components/security/app-lock';
import { setLocale, useT } from '@/lib/i18n';

const profileFormSchema = profileSchema;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { t, locale } = useT();
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [search, setSearch] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', defaultCurrency: 'IDR', budgetStartDay: 1 },
  });

  useEffect(() => {
    fetch('/api/settings/profile')
      .then((res) => res.json())
      .then((data) => {
        profileForm.reset({
          name: data.name,
          defaultCurrency: data.defaultCurrency || 'IDR',
          budgetStartDay: data.budgetStartDay || 1,
        });
        setEmail(data.email);
      });
    fetch('/api/settings/categories')
      .then((res) => res.json())
      .then(setCategories);
  }, [profileForm]);

  async function onProfileSubmit(values: ProfileFormValues) {
    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast({ description: error || t('Gagal menyimpan profil', 'Could not save profile'), variant: 'destructive' });
      return;
    }
    const { moved } = await res.json().catch(() => ({}));
    toast({
      description: moved
        ? t(`Profil tersimpan. ${moved} transaksi dipindah ke periode yang sesuai.`, `Profile saved. ${moved} transactions moved to the matching period.`)
        : t('Profil tersimpan', 'Profile saved'),
    });
    profileForm.reset(values);
    // Keep the shared user in sync so amounts re-render in the new currency.
    const current = useAppStore.getState().user;
    if (current) {
      useAppStore.getState().setUser({
        ...current,
        name: values.name,
        defaultCurrency: values.defaultCurrency,
        budgetStartDay: values.budgetStartDay,
      });
    }
    if (moved) useAppStore.getState().bumpData();
  }

  async function handleSaveCategory(values: CategoryFormValues) {
    if (editingCategory) {
      const res = await fetch(`/api/settings/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ description: t('Kategori tersimpan', 'Category saved') });
      } else {
        const { error } = await res.json();
        toast({ description: error || t('Gagal menyimpan', 'Could not save'), variant: 'destructive' });
      }
    } else {
      const res = await fetch('/api/settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        toast({ description: t('Kategori tersimpan', 'Category saved') });
      } else {
        const { error } = await res.json();
        toast({ description: error || t('Gagal menyimpan', 'Could not save'), variant: 'destructive' });
      }
    }
  }

  async function handleDeleteCategory(id: string) {
    const res = await fetch(`/api/settings/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ description: t('Kategori dihapus', 'Category deleted') });
    } else {
      const { error } = await res.json();
      toast({ description: error || t('Gagal menghapus kategori', 'Could not delete category'), variant: 'destructive' });
    }
    setDeleteId(null);
  }

  const filtered = categories.filter((c) => {
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('Pengaturan', 'Settings')}</h1>
        <p className="text-muted-foreground">
          {t('Atur profil, mata uang, kategori, dan kelola bersama.', 'Profile, currency, categories and sharing.')}
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Profil & preferensi', 'Profile & preferences')}</CardTitle>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Nama', 'Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Email</FormLabel>
                  <Input value={email} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="language">{t('Bahasa', 'Language')}</FormLabel>
                  <Select value={locale} onValueChange={(v) => setLocale(v as 'id' | 'en')}>
                    <SelectTrigger id="language" aria-label={t('Bahasa', 'Language')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormField
                  control={profileForm.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Mata uang', 'Currency')}</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="budgetStartDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Periode budget dimulai tanggal', 'Budget period starts on day')}</FormLabel>
                      <FormControl>
                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d === 1 ? t('1 (bulan kalender)', '1 (calendar month)') : t(`Tanggal ${d}`, `Day ${d}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {t(
                          'Pilih tanggal gajian kalau budget kamu mengikuti gaji. Misalnya 25: transaksi 25 September sampai 24 Oktober masuk budget Oktober.',
                          'Pick your payday if your budget follows your salary. For example 25: transactions from 25 September to 24 October count toward the October budget.'
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!profileForm.formState.isDirty}>
                  {t('Simpan perubahan', 'Save changes')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Kategori', 'Categories')}</CardTitle>
            <Button
              onClick={() => {
                setEditingCategory(undefined);
                setCategoryDialogOpen(true);
              }}
            >
              {t('Tambah kategori', 'Add category')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex flex-col gap-2">
              <ToggleGroup
                type="single"
                value={typeFilter}
                onValueChange={(v) => setTypeFilter((v as any) || 'all')}
                className="w-full"
              >
                <ToggleGroupItem value="all">{t('Semua', 'All')}</ToggleGroupItem>
                <ToggleGroupItem value="expense">{t('Pengeluaran', 'Expense')}</ToggleGroupItem>
                <ToggleGroupItem value="income">{t('Pemasukan', 'Income')}</ToggleGroupItem>
              </ToggleGroup>
              <Input
                placeholder={t('Cari kategori...', 'Search categories...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t('Tidak ada kategori yang cocok.', 'No matching categories.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
                <div className="space-y-2">
                  {filtered.map((c) => {
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon name={c.icon} className="h-5 w-5" />
                          <div>
                            <p className="font-medium leading-none">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.type === 'income' ? t('Pemasukan', 'Income') : t('Pengeluaran', 'Expense')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingCategory(c);
                              setCategoryDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SharedSpaceCard />

      <AppLockCard />

      <AboutAppCard />

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        initialData={editingCategory}
        onSubmit={handleSaveCategory}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Hapus kategori?', 'Delete category?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Kategori yang masih dipakai transaksi tidak bisa dihapus. Tindakan ini tidak bisa dibatalkan.',
                'Categories still used by transactions cannot be deleted. This cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Batal', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDeleteCategory(deleteId)}>
              {t('Hapus', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
