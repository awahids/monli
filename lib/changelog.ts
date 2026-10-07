/**
 * What changed, one entry per day. The day is the version (YYYY.MM.DD), so
 * every change merged on a day goes into that day's entry: add to the top
 * entry if it is today's, otherwise start a new one above it.
 */
export type ChangelogEntry = {
  version: string;
  /** YYYY-MM-DD, the same day as the version. */
  date: string;
  /** One-line summary of the day. */
  title: string;
  items: { type: 'baru' | 'perbaikan' | 'peningkatan'; text: string }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2026.10.07',
    date: '2026-10-07',
    title: 'Rasa aplikasi mobile',
    items: [
      { type: 'baru', text: 'Tampilan setelah login seperti aplikasi mobile di semua layar, dengan navigasi bawah dan menu Lainnya.' },
      { type: 'baru', text: 'Halaman "Yang baru" berisi catatan perubahan per hari.' },
      { type: 'baru', text: 'Pasang Qala Saku di layar utama langsung dari menu Lainnya.' },
      { type: 'baru', text: 'Tombol Perbarui muncul saat versi baru tersedia.' },
      { type: 'baru', text: 'Panduan awal untuk pengguna baru, bisa dibuka lagi dari Pengaturan.' },
      { type: 'baru', text: 'Aplikasi bisa dibuka tanpa internet dengan data terakhir; transaksi yang dicatat atau dihapus saat offline tersinkron otomatis saat online.' },
      { type: 'peningkatan', text: 'Form terbuka dari bawah layar dan konfirmasi tampil sebagai kartu kecil.' },
      { type: 'peningkatan', text: 'Landing page baru dengan gaya editorial gelap.' },
      { type: 'peningkatan', text: 'Halaman aplikasi lebih ringan: JavaScript yang diunduh berkurang sekitar 25–40%, sehingga lebih cepat dibuka di HP.' },
      { type: 'perbaikan', text: 'Edit dan hapus transaksi kembali berfungsi.' },
      { type: 'perbaikan', text: 'Kolom email dan kata sandi di halaman Masuk terbaca oleh pembaca layar.' },
    ],
  },
  {
    version: '2026.10.06',
    date: '2026-10-06',
    title: 'Kelola bersama keluarga',
    items: [
      { type: 'baru', text: 'PRO: undang pasangan atau keluarga untuk mengelola keuangan bersama, sebagai Editor atau Pemantau.' },
      { type: 'baru', text: 'Daftar transaksi menampilkan siapa yang mencatat saat dipakai bersama.' },
      { type: 'baru', text: 'Periode budget bisa dimulai di tanggal gajian.' },
      { type: 'baru', text: 'Saran tag dari riwayat transaksi.' },
      { type: 'peningkatan', text: 'Akun tampil sebagai kartu.' },
      { type: 'peningkatan', text: 'Video promo di landing page yang diputar mengikuti scroll.' },
      { type: 'perbaikan', text: 'Ikon kategori bisa dipilih lagi saat membuat kategori.' },
      { type: 'perbaikan', text: 'Pembaruan keamanan dependensi.' },
    ],
  },
  {
    version: '2026.10.05',
    date: '2026-10-05',
    title: 'Monli menjadi Qala Saku',
    items: [
      { type: 'baru', text: 'Monli sekarang bernama Qala Saku, bagian dari keluarga Qala.' },
      { type: 'baru', text: 'Transaksi rutin yang tercatat otomatis setiap jatuh tempo.' },
      { type: 'baru', text: 'Target tabungan dengan setoran bulanan yang disarankan.' },
      { type: 'baru', text: 'Masuk dengan akun Google.' },
      { type: 'peningkatan', text: 'Tampilan baru untuk beranda, transaksi, budget, dan laporan.' },
      { type: 'perbaikan', text: 'Keamanan data dan perhitungan saldo yang lebih akurat.' },
    ],
  },
];

/** The current version: the newest day in the changelog. */
export const APP_VERSION = CHANGELOG[0].version;
