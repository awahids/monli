/**
 * Product identity in one place. Qala Saku (formerly Monli) is part of the
 * Qala family (qala.digital), alongside Qala Invoice.
 */
export const BRAND = {
  name: 'Qala Saku',
  family: 'Qala',
  /** The word after "Qala" in the wordmark. */
  product: 'Saku',
  formerName: 'Monli',
  familyUrl: 'https://qala.digital',
  url: 'https://monli.fun',
  tagline: 'Aplikasi keuangan pribadi untuk catat, atur budget, dan pantau tabungan',
  description:
    'Catat pemasukan dan pengeluaran di semua rekening dan e-wallet, atur budget bulanan, dan lihat ke mana uangmu pergi. Bagian dari keluarga Qala.',
  themeColor: '#14A7A0',
} as const;

export type QalaProduct = {
  name: string;
  description: string;
  url: string;
};

/** Sibling products shown in footers and the app sidebar. */
export const QALA_FAMILY: QalaProduct[] = [
  {
    name: 'Qala Saku',
    description: 'Keuangan pribadi',
    url: 'https://monli.fun',
  },
  {
    name: 'Qala Invoice',
    description: 'Invoice untuk UMKM',
    url: 'https://invoice.monli.fun',
  },
];
