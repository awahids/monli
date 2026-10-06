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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import * as Icons from 'lucide-react';

const profileFormSchema = profileSchema;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
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
      toast({ description: error || 'Gagal menyimpan profil', variant: 'destructive' });
      return;
    }
    toast({ description: 'Profil tersimpan' });
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
        toast({ description: 'Kategori tersimpan' });
      } else {
        const { error } = await res.json();
        toast({ description: error || 'Gagal menyimpan', variant: 'destructive' });
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
        toast({ description: 'Kategori tersimpan' });
      } else {
        const { error } = await res.json();
        toast({ description: error || 'Gagal menyimpan', variant: 'destructive' });
      }
    }
  }

  async function handleDeleteCategory(id: string) {
    const res = await fetch(`/api/settings/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ description: 'Kategori dihapus' });
    } else {
      const { error } = await res.json();
      toast({ description: error || 'Gagal menghapus kategori', variant: 'destructive' });
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="text-muted-foreground">Atur profil, mata uang, dan kategori.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil & preferensi</CardTitle>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
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
                <div>
                  <FormLabel>Email</FormLabel>
                  <Input value={email} readOnly disabled />
                </div>
                <FormField
                  control={profileForm.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata uang</FormLabel>
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
                      <FormLabel>Periode budget dimulai tanggal</FormLabel>
                      <FormControl>
                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d === 1 ? '1 (bulan kalender)' : `Tanggal ${d}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Pilih tanggal gajian kalau budget kamu mengikuti gaji. Misalnya 25: transaksi 25
                        September sampai 24 Oktober masuk budget Oktober.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!profileForm.formState.isDirty}>
                  Simpan perubahan
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kategori</CardTitle>
            <Button
              onClick={() => {
                setEditingCategory(undefined);
                setCategoryDialogOpen(true);
              }}
            >
              Tambah kategori
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ToggleGroup
                type="single"
                value={typeFilter}
                onValueChange={(v) => setTypeFilter((v as any) || 'all')}
                className="w-full sm:w-auto"
              >
                <ToggleGroupItem value="all">Semua</ToggleGroupItem>
                <ToggleGroupItem value="expense">Pengeluaran</ToggleGroupItem>
                <ToggleGroupItem value="income">Pemasukan</ToggleGroupItem>
              </ToggleGroup>
              <Input
                placeholder="Cari kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:ml-auto sm:w-64"
              />
            </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Tidak ada kategori yang cocok.
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Warna</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const Icon = (Icons as any)[c.icon as keyof typeof Icons];
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{Icon ? <Icon className="h-4 w-4" /> : null}</TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</TableCell>
                          <TableCell>
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: c.color }} />
                          </TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingCategory(c);
                                setCategoryDialogOpen(true);
                              }}
                            >
                              <Icons.Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                              <Icons.Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="space-y-2 md:hidden">
                  {filtered.map((c) => {
                    const Icon = (Icons as any)[c.icon as keyof typeof Icons];
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                          <span>{Icon ? <Icon className="h-5 w-5" /> : null}</span>
                          <div>
                            <p className="font-medium leading-none">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</p>
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
                            <Icons.Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                            <Icons.Trash2 className="h-4 w-4" />
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

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        initialData={editingCategory}
        onSubmit={handleSaveCategory}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori yang masih dipakai transaksi tidak bisa dihapus. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDeleteCategory(deleteId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
