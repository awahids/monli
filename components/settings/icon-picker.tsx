'use client';

import { CategoryIcon } from '@/components/transactions/category-icon';
import { cn } from '@/lib/utils';

/**
 * Curated lucide icons for money categories, with Indonesian labels for screen
 * readers. Rendered inline: a popover listing all ~3,500 lucide icons took
 * seconds to open and ended up behind the dialog, so nothing could be picked.
 */
export const CATEGORY_ICONS: { name: string; label: string }[] = [
  { name: 'Utensils', label: 'Makan' },
  { name: 'Coffee', label: 'Kopi' },
  { name: 'Sandwich', label: 'Jajan' },
  { name: 'Pizza', label: 'Makanan cepat saji' },
  { name: 'ShoppingCart', label: 'Belanja dapur' },
  { name: 'ShoppingBag', label: 'Belanja' },
  { name: 'Shirt', label: 'Pakaian' },
  { name: 'Package', label: 'Paket' },
  { name: 'Car', label: 'Mobil' },
  { name: 'Bike', label: 'Motor / sepeda' },
  { name: 'Bus', label: 'Transportasi umum' },
  { name: 'TrainFront', label: 'Kereta' },
  { name: 'Fuel', label: 'Bensin' },
  { name: 'CircleParking', label: 'Parkir' },
  { name: 'Plane', label: 'Pesawat' },
  { name: 'Hotel', label: 'Penginapan' },
  { name: 'House', label: 'Rumah' },
  { name: 'Zap', label: 'Listrik' },
  { name: 'Droplet', label: 'Air' },
  { name: 'Flame', label: 'Gas' },
  { name: 'Wifi', label: 'Internet' },
  { name: 'Smartphone', label: 'Pulsa / HP' },
  { name: 'Tv', label: 'TV / streaming' },
  { name: 'Wrench', label: 'Perbaikan' },
  { name: 'HeartPulse', label: 'Kesehatan' },
  { name: 'Pill', label: 'Obat' },
  { name: 'Stethoscope', label: 'Dokter' },
  { name: 'ShieldCheck', label: 'Asuransi' },
  { name: 'GraduationCap', label: 'Pendidikan' },
  { name: 'BookOpen', label: 'Buku' },
  { name: 'Baby', label: 'Anak' },
  { name: 'PawPrint', label: 'Hewan peliharaan' },
  { name: 'Gamepad2', label: 'Hiburan' },
  { name: 'Film', label: 'Film' },
  { name: 'Music', label: 'Musik' },
  { name: 'Ticket', label: 'Tiket' },
  { name: 'Dumbbell', label: 'Olahraga' },
  { name: 'Scissors', label: 'Perawatan diri' },
  { name: 'Sparkles', label: 'Kecantikan' },
  { name: 'Gift', label: 'Hadiah' },
  { name: 'HandHeart', label: 'Donasi / zakat' },
  { name: 'Users', label: 'Keluarga' },
  { name: 'Receipt', label: 'Tagihan' },
  { name: 'CreditCard', label: 'Kartu kredit / cicilan' },
  { name: 'Percent', label: 'Pajak / bunga' },
  { name: 'Landmark', label: 'Bank' },
  { name: 'Wallet', label: 'Gaji' },
  { name: 'Briefcase', label: 'Pekerjaan' },
  { name: 'Laptop', label: 'Freelance' },
  { name: 'Building2', label: 'Usaha' },
  { name: 'Banknote', label: 'Tunai' },
  { name: 'Coins', label: 'Uang receh' },
  { name: 'HandCoins', label: 'Pinjaman' },
  { name: 'PiggyBank', label: 'Tabungan' },
  { name: 'TrendingUp', label: 'Investasi' },
  { name: 'Award', label: 'Bonus' },
];

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  // Keep an icon picked with the old picker visible and selected.
  const options =
    value && !CATEGORY_ICONS.some((i) => i.name === value)
      ? [{ name: value, label: value }, ...CATEGORY_ICONS]
      : CATEGORY_ICONS;

  return (
    <div
      role="radiogroup"
      aria-label="Ikon"
      className="grid max-h-56 grid-cols-7 gap-1.5 overflow-y-auto rounded-lg border p-2"
    >
      {options.map(({ name, label }) => {
        const selected = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(name)}
            className={cn(
              'flex aspect-square items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'border-transparent text-white' : 'border-transparent text-muted-foreground hover:bg-muted'
            )}
            style={selected ? { backgroundColor: color || 'hsl(var(--primary))' } : undefined}
          >
            <CategoryIcon name={name} className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
