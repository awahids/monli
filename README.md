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
- `SUPABASE_SERVICE_ROLE_KEY` – wajib; status pembayaran dan plan hanya ditulis dari server

Atur **Payment Notification URL** di dashboard Midtrans ke `https://<domain>/api/payments/notify`. Plan user hanya di-upgrade ke PRO setelah status pembayaran diverifikasi langsung ke Midtrans (lewat webhook ini atau saat halaman pembayaran dibuka), tidak pernah dari status yang dikirim browser.

## Web Push

Aplikasi web yang dipasang (PWA) dan browser menerima pengingat yang sama dengan aplikasi HP. Beranda mengunggah jadwal pengingatnya ke `saku.push_schedule`. Setiap 5 menit, `pg_cron` (`saku.request_push_send`) memanggil `/api/cron/push` kalau ada yang jatuh tempo, lalu route itu mengirimnya ke setiap browser milik user.

1. Buat sepasang kunci: `npx web-push generate-vapid-keys`.
2. Isi variabel lingkungan di Vercel, lalu deploy ulang:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – kunci publik
   - `VAPID_PRIVATE_KEY` – kunci privat
   - `CRON_SECRET` – string acak panjang, misalnya dari `openssl rand -hex 24`
   - `VAPID_SUBJECT` (opsional) – `mailto:` atau `https:` untuk dihubungi push service
3. Simpan alamat aplikasi dan secret yang sama di Supabase Vault (SQL Editor):

   ```sql
   select vault.create_secret('https://monli.fun', 'saku_app_url');
   select vault.create_secret('<CRON_SECRET yang sama>', 'saku_cron_secret');
   ```

Peringatan budget dikirim dari server: setelah pengeluaran disimpan, trigger `saku.request_budget_alerts` memanggil `/api/cron/budget-alerts` (dengan secret yang sama) untuk pemilik yang punya browser berlangganan. Tiap level (80%, 100%) dikirim sekali per bulan budget (`saku.push_budget_alerts`). Pengingat harian jam 20.00 dilewati kalau hari itu sudah ada transaksi.

Tanpa kunci VAPID, Pengaturan > Notifikasi di web tetap seperti sebelumnya (hanya peringatan budget di dalam aplikasi). Tanpa secret di Vault, cron tidak memanggil apa pun. Di iPhone, Web Push hanya jalan di iOS 16.4+ setelah Qala Saku ditambahkan ke Layar Utama.

## Konfigurasi OCR SumoPod

Fitur pemindaian struk (OCR) untuk pembuatan transaksi tersedia untuk pengguna PRO. Tambahkan variabel lingkungan berikut:

- `SUMOPOD_API_KEY` – API key untuk [SumoPod AI](https://ai.sumopod.com)
- `SUMOPOD_MODEL` – ID model SumoPod AI (`gpt-4o-mini` default; supports `gpt-4o`)
