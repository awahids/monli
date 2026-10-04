# Qala Saku

Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah.

> **Qala Saku** (sebelumnya **Monli**) adalah bagian dari [keluarga Qala](https://qala.digital), bersama [Qala Invoice](https://invoice.monli.fun). Domain tetap [monli.fun](https://monli.fun).

Qala Saku adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat. Cerdas, mudah digunakan, dan dilengkapi grafik interaktif agar kamu bisa melihat gambaran keuangan secara utuh dan membuat keputusan finansial yang tepat.

## Fitur Unggulan

- **Pencatatan Pengeluaran & Pemasukan**: Catat transaksi harian dengan kategori yang bisa disesuaikan.
- **Anggaran & Pengingat**: Tetapkan anggaran untuk setiap kategori dan dapatkan peringatan jika mendekati batas.
- **Analisis & Grafik**: Pantau tren keuangan melalui grafik interaktif dan ringkasan bulanan.
- **Tabungan & Tujuan**: Buat target tabungan, ikuti progres, dan raih tujuan finansialmu.
- **Sinkronisasi & Keamanan**: Data terenkripsi dan bisa disinkronkan antar perangkat.
- **Upgrade ke Pro**: Tingkatkan akun melalui Midtrans dan pantau status pembayaranmu.

Lihat [docs/seo.md](docs/seo.md) untuk detail strategi dan kata kunci SEO.

## Identitas Brand

Nama produk, tagline, dan daftar produk keluarga Qala ada di `lib/brand.ts`; logo di `components/brand/qala-mark.tsx`. Palet (Jade Teal `#14A7A0`, Deep Teal `#0E8079`, Warm Gold `#F9A620`, Navy `#0B0F24`, Warm Cream `#F2EFE9`) dan tipografi (Poppins untuk judul, Inter untuk teks) sama dengan Qala Invoice; token warnanya ada di `app/globals.css`.

Nama `monli` sengaja dipertahankan di tempat internal (nama package, nama database IndexedDB offline, domain) agar data dan tautan lama tetap berfungsi.

## Konfigurasi Midtrans

Untuk mengaktifkan pembayaran Midtrans, siapkan variabel lingkungan berikut:

- `MIDTRANS_SERVER_KEY` – server key dari Midtrans
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` – client key untuk skrip Snap
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` – set ke `true` bila menggunakan mode produksi; biarkan kosong untuk sandbox

## Konfigurasi OCR SumoPod

Fitur pemindaian struk (OCR) untuk pembuatan transaksi tersedia untuk pengguna PRO. Tambahkan variabel lingkungan berikut:

- `SUMOPOD_API_KEY` – API key untuk [SumoPod AI](https://ai.sumopod.com)
- `SUMOPOD_MODEL` – ID model SumoPod AI (`gpt-4o-mini` default; supports `gpt-4o`)
