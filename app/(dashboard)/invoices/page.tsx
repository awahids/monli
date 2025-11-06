'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  FileDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';

interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
}

interface InvoiceFormState {
  issuerType: 'company' | 'individual';
  issuerName: string;
  issuerEmail: string;
  issuerPhone: string;
  issuerAddress: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  terms: string;
  items: InvoiceItem[];
  includeTax: boolean;
  includeDiscount: boolean;
  includeShipping: boolean;
  taxRate: number;
  discount: number;
  shipping: number;
}

const emptyItem = (): InvoiceItem => ({
  id: `item-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
  name: '',
  description: '',
  quantity: 1,
  price: 0,
});

const currencyOptions = [
  { value: 'IDR', label: 'IDR - Rupiah' },
  { value: 'USD', label: 'USD - Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Pound' },
];

export default function InvoiceBuilderPage() {
  const [currency, setCurrency] = useState('IDR');
  const [form, setForm] = useState<InvoiceFormState>({
    issuerType: 'company',
    issuerName: '',
    issuerEmail: '',
    issuerPhone: '',
    issuerAddress: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    notes: '',
    terms: '',
    items: [emptyItem()],
    includeTax: false,
    includeDiscount: false,
    includeShipping: false,
    taxRate: 11,
    discount: 0,
    shipping: 0,
  });

  const subtotal = useMemo(
    () =>
      form.items.reduce((acc, item) => {
        const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
        const price = Number.isFinite(item.price) ? item.price : 0;
        return acc + quantity * price;
      }, 0),
    [form.items]
  );

  const taxAmount = form.includeTax ? (subtotal * form.taxRate) / 100 : 0;
  const discountAmount = form.includeDiscount ? form.discount : 0;
  const shippingAmount = form.includeShipping ? form.shipping : 0;
  const total = subtotal + taxAmount + shippingAmount - discountAmount;

  const handleFormChange = <K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleItemChange = <K extends keyof InvoiceItem>(
    id: string,
    key: K,
    value: InvoiceItem[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]:
                key === 'quantity' || key === 'price'
                  ? Number(value) || 0
                  : value,
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const formatAmount = (value: number) => formatCurrency(value, currency);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = () => {
    const { items, ...rest } = form;
    const data = {
      ...rest,
      currency,
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      summary: {
        subtotal,
        taxAmount,
        discountAmount,
        shippingAmount,
        total,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${form.invoiceNumber || Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Generator Invoice</h1>
        <p className="text-muted-foreground">
          Buat invoice profesional lengkap dengan detail perusahaan, pelanggan, dan item.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="order-2 xl:order-1">
          <CardHeader>
            <CardTitle>Detail Invoice</CardTitle>
            <CardDescription>
              Lengkapi informasi berikut untuk membangun invoice Anda. Kolom bertanda opsional dapat dikosongkan sesuai kebutuhan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Penerbit</h2>
                <Badge variant="outline">Wajib</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issuer-type">Tipe Penerbit</Label>
                  <Select
                    value={form.issuerType}
                    onValueChange={(value: 'company' | 'individual') =>
                      handleFormChange('issuerType', value)
                    }
                  >
                    <SelectTrigger id="issuer-type">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Perusahaan</SelectItem>
                      <SelectItem value="individual">Perorangan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer-name">Nama {form.issuerType === 'company' ? 'Perusahaan' : 'Perorangan'}</Label>
                  <Input
                    id="issuer-name"
                    value={form.issuerName}
                    placeholder="PT Contoh Jaya"
                    onChange={(event) => handleFormChange('issuerName', event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="issuer-email">Email <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="issuer-email"
                    value={form.issuerEmail}
                    placeholder="finance@contoh.com"
                    onChange={(event) => handleFormChange('issuerEmail', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer-phone">Telepon <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="issuer-phone"
                    value={form.issuerPhone}
                    placeholder="0812-3456-7890"
                    onChange={(event) => handleFormChange('issuerPhone', event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="invoice-number">Nomor Invoice <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="invoice-number"
                    value={form.invoiceNumber}
                    placeholder="INV-2024-001"
                    onChange={(event) => handleFormChange('invoiceNumber', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer-address">Alamat <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  id="issuer-address"
                  value={form.issuerAddress}
                  placeholder="Jl. Contoh Raya No. 123, Jakarta"
                  onChange={(event) => handleFormChange('issuerAddress', event.target.value)}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Pelanggan</h2>
                <Badge variant="outline">Wajib</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nama Customer</Label>
                  <Input
                    id="customer-name"
                    value={form.customerName}
                    placeholder="Nama pelanggan"
                    onChange={(event) => handleFormChange('customerName', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="customer-email"
                    value={form.customerEmail}
                    placeholder="customer@contoh.com"
                    onChange={(event) => handleFormChange('customerEmail', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-address">Alamat <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  id="customer-address"
                  value={form.customerAddress}
                  placeholder="Alamat penagihan customer"
                  onChange={(event) => handleFormChange('customerAddress', event.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Tanggal Terbit</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={form.issueDate}
                    onChange={(event) => handleFormChange('issueDate', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Jatuh Tempo <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => handleFormChange('dueDate', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Item &amp; Harga</h2>
                <div className="flex items-center gap-3">
                  <div className="space-y-1 text-right">
                    <Label htmlFor="currency" className="text-xs uppercase text-muted-foreground">
                      Mata Uang
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency" className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={addItem} className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Tambah item
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {form.items.map((item, index) => (
                  <Card key={item.id} className="bg-muted/40">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`item-name-${item.id}`}>Nama Item</Label>
                          <Input
                            id={`item-name-${item.id}`}
                            placeholder={`Item ${index + 1}`}
                            value={item.name}
                            onChange={(event) => handleItemChange(item.id, 'name', event.target.value)}
                          />
                        </div>
                        <div className="flex items-start justify-between gap-2 lg:w-40">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`item-qty-${item.id}`}>Qty</Label>
                            <Input
                              id={`item-qty-${item.id}`}
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(event) => handleItemChange(item.id, 'quantity', Number(event.target.value))}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`item-price-${item.id}`}>Harga</Label>
                            <Input
                              id={`item-price-${item.id}`}
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={(event) => handleItemChange(item.id, 'price', Number(event.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-desc-${item.id}`}>Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                        <Textarea
                          id={`item-desc-${item.id}`}
                          placeholder="Catatan singkat mengenai item"
                          value={item.description}
                          onChange={(event) => handleItemChange(item.id, 'description', event.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Total item</span>
                        <span className="font-medium text-foreground">
                          {formatAmount(item.quantity * item.price)}
                        </span>
                      </div>
                    </CardContent>
                    {form.items.length > 1 && (
                      <CardFooter className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus item
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Tambahkan pajak</p>
                    <p className="text-xs text-muted-foreground">Hitung PPN atau pajak lain per %</p>
                  </div>
                  <Switch
                    checked={form.includeTax}
                    onCheckedChange={(checked) => handleFormChange('includeTax', checked)}
                    aria-label="Tambah pajak"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Diskon</p>
                    <p className="text-xs text-muted-foreground">Masukkan nominal potongan</p>
                  </div>
                  <Switch
                    checked={form.includeDiscount}
                    onCheckedChange={(checked) => handleFormChange('includeDiscount', checked)}
                    aria-label="Tambah diskon"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Biaya lain</p>
                    <p className="text-xs text-muted-foreground">Mis. ongkir atau jasa tambahan</p>
                  </div>
                  <Switch
                    checked={form.includeShipping}
                    onCheckedChange={(checked) => handleFormChange('includeShipping', checked)}
                    aria-label="Tambah biaya lain"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {form.includeTax && (
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Persentase pajak (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min={0}
                      value={form.taxRate}
                      onChange={(event) => handleFormChange('taxRate', Number(event.target.value))}
                    />
                  </div>
                )}
                {form.includeDiscount && (
                  <div className="space-y-2">
                    <Label htmlFor="discount">Nominal diskon</Label>
                    <Input
                      id="discount"
                      type="number"
                      min={0}
                      value={form.discount}
                      onChange={(event) => handleFormChange('discount', Number(event.target.value))}
                    />
                  </div>
                )}
                {form.includeShipping && (
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Biaya lain</Label>
                    <Input
                      id="shipping"
                      type="number"
                      min={0}
                      value={form.shipping}
                      onChange={(event) => handleFormChange('shipping', Number(event.target.value))}
                    />
                  </div>
                )}
              </div>
            </section>

            <Separator />

            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan untuk customer</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  placeholder="Tuliskan detail penting atau instruksi pembayaran"
                  onChange={(event) => handleFormChange('notes', event.target.value)}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Syarat &amp; ketentuan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  id="terms"
                  value={form.terms}
                  placeholder="Contoh: Pembayaran dilakukan maksimal 14 hari setelah invoice diterima"
                  onChange={(event) => handleFormChange('terms', event.target.value)}
                  rows={5}
                />
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="order-1 space-y-6 xl:order-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Pratinjau</CardTitle>
                <CardDescription>
                  Tinjau kembali sebelum membagikan atau mencetak invoice.
                </CardDescription>
              </div>
              <Badge variant="secondary">Realtime</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {form.issuerType === 'company' ? 'Perusahaan' : 'Perorangan'}
                </p>
                <h2 className="text-2xl font-bold">{form.issuerName || 'Nama Penerbit'}</h2>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {form.issuerEmail && <p>Email: {form.issuerEmail}</p>}
                  {form.issuerPhone && <p>Telepon: {form.issuerPhone}</p>}
                  {form.issuerAddress && <p>Alamat: {form.issuerAddress}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border bg-muted/50 p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-muted-foreground">Kepada</span>
                  <span className="text-lg font-semibold text-foreground">
                    {form.customerName || 'Nama Customer'}
                  </span>
                  {form.customerEmail && <span>{form.customerEmail}</span>}
                  {form.customerAddress && <span>{form.customerAddress}</span>}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Nomor Invoice</p>
                    <p>{form.invoiceNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tanggal Terbit</p>
                    <p>{form.issueDate || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Jatuh Tempo</p>
                    <p>{form.dueDate || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Mata Uang</p>
                    <p>{currency}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                  <span className="flex-1">Item</span>
                  <span className="w-16 text-right">Qty</span>
                  <span className="w-28 text-right">Harga</span>
                  <span className="w-28 text-right">Total</span>
                </div>
                <div className="divide-y rounded-lg border bg-card">
                  {form.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] items-start gap-2 px-4 py-3 text-sm md:gap-4">
                      <div>
                        <p className="font-medium text-foreground">{item.name || 'Item tanpa nama'}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <span className="w-16 text-right font-medium">
                        {item.quantity}
                      </span>
                      <span className="w-28 text-right">
                        {formatAmount(item.price)}
                      </span>
                      <span className="w-28 text-right font-semibold text-foreground">
                        {formatAmount(item.quantity * item.price)}
                      </span>
                    </div>
                  ))}
                  {form.items.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Belum ada item yang ditambahkan.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatAmount(subtotal)}</span>
                </div>
                {form.includeTax && (
                  <div className="flex justify-between">
                    <span>Pajak ({form.taxRate}%)</span>
                    <span className="font-medium">{formatAmount(taxAmount)}</span>
                  </div>
                )}
                {form.includeDiscount && (
                  <div className="flex justify-between">
                    <span>Diskon</span>
                    <span className="font-medium">- {formatAmount(discountAmount)}</span>
                  </div>
                )}
                {form.includeShipping && (
                  <div className="flex justify-between">
                    <span>Biaya lain</span>
                    <span className="font-medium">{formatAmount(shippingAmount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatAmount(total)}</span>
                </div>
              </div>

              {form.notes && (
                <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                  <p className="font-semibold text-foreground">Catatan</p>
                  <p className="text-muted-foreground whitespace-pre-line">{form.notes}</p>
                </div>
              )}

              {form.terms && (
                <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                  <p className="font-semibold text-foreground">Syarat &amp; Ketentuan</p>
                  <p className="text-muted-foreground whitespace-pre-line">{form.terms}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownload}>
                <FileDown className="mr-2 h-4 w-4" /> Simpan JSON
              </Button>
              <Button className="w-full sm:w-auto" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Cetak Invoice
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle>Tips cepat</CardTitle>
              <CardDescription>Beberapa opsi tambahan yang bisa membantu kebutuhan penagihan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • Gunakan kolom syarat &amp; ketentuan untuk menjelaskan metode pembayaran, nomor rekening, atau penalti keterlambatan.
              </p>
              <p>
                • Simpan versi JSON untuk memudahkan integrasi dengan sistem lain atau membuat template invoice berulang.
              </p>
              <p>
                • Undang tim Anda untuk mengisi detail secara kolaboratif dengan membagikan link halaman ini.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
