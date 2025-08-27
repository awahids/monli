# monli

Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah.

monli adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat. Cerdas, mudah digunakan, dan dilengkapi grafik interaktif agar kamu bisa melihat gambaran keuangan secara utuh dan membuat keputusan finansial yang tepat.

## Fitur Unggulan

- **Pencatatan Pengeluaran & Pemasukan**: Catat transaksi harian dengan kategori yang bisa disesuaikan.
- **Anggaran & Pengingat**: Tetapkan anggaran untuk setiap kategori dan dapatkan peringatan jika mendekati batas.
- **Analisis & Grafik**: Pantau tren keuangan melalui grafik interaktif dan ringkasan bulanan.
- **Tabungan & Tujuan**: Buat target tabungan, ikuti progres, dan raih tujuan finansialmu.
- **Sinkronisasi & Keamanan**: Data terenkripsi dan bisa disinkronkan antar perangkat.
- **Upgrade ke Pro**: Tingkatkan akun melalui Midtrans dan pantau status pembayaranmu.

Lihat [docs/seo.md](docs/seo.md) untuk detail strategi dan kata kunci SEO.

## Konfigurasi Midtrans

Untuk mengaktifkan pembayaran Midtrans, siapkan variabel lingkungan berikut:

- `MIDTRANS_SERVER_KEY` – server key dari Midtrans
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` – client key untuk skrip Snap
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` – set ke `true` bila menggunakan mode produksi; biarkan kosong untuk sandbox
