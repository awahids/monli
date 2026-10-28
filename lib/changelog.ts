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
    version: '2026.10.28',
    date: '2026-10-28',
    title: 'Ikon khas Qala Saku, ikon kategori baru & kenalan dengan Kanto',
    items: [
      { type: 'peningkatan', text: 'Ikon menu kini digambar khusus untuk Qala Saku, masing-masing dengan berlian emas dari logo Qala yang berputar saat halamannya dibuka.' },
      { type: 'peningkatan', text: 'Semua 56 ikon kategori dan target tabungan digambar ulang dengan gaya yang sama. Kategori yang sudah kamu buat ikut berganti otomatis.' },
      { type: 'baru', text: 'Kenalan dengan Kanto, maskot Qala Saku: kantong mungil yang menyapa di beranda, melambai saat muncul dan melompat kegirangan kalau ditekan. Warnanya ikut warna aksen yang kamu pilih.' },
      { type: 'peningkatan', text: 'Kanto kini ikut menyambut di layar pembuka saat Qala Saku dibuka.' },
    ],
  },
  {
    version: '2026.10.27',
    date: '2026-10-27',
    title: 'Laporan bulanan, prediksi, notifikasi, widget, lampiran & tema Islami baru',
    items: [
      { type: 'baru', text: 'Pengguna PRO bisa menyimpan sampai 5 lampiran lain di tiap transaksi, misalnya kartu garansi atau invoice PDF, selain foto struk.' },
      { type: 'peningkatan', text: 'Pencarian transaksi kini menemukan tag dari sebagian katanya, misalnya "kant" untuk tag "kantor".' },
      { type: 'peningkatan', text: 'Tema Islami kini dihiasi lentera yang berayun pelan, bintang berkelip, dan motif geometris yang tidak menutupi saldo. Di mode gelap, kartu saldo tetap hijau zamrud dengan tulisan terang.' },
      { type: 'baru', text: 'Laporan bulanan: ringkasan tiap periode budget, berisi yang berhasil disisihkan, pemasukan dan pengeluaran dibanding periode sebelumnya, kategori terbesar, budget yang terlewati, dan transaksi terbesar. Di minggu pertama periode baru, beranda memberi tahu saat laporannya siap.' },
      { type: 'baru', text: 'Pengguna PRO melihat prediksi pengeluaran sampai akhir periode, apakah budget akan cukup, dan budget kategori mana yang akan habis duluan.' },
      { type: 'baru', text: 'Di aplikasi iOS dan Android, Qala Saku bisa mengingatkan tagihan yang jatuh tempo besok, mengingatkan mencatat jam 20.00 kalau hari itu belum ada transaksi, dan memberi tahu saat laporan bulanan siap. Atur di Pengaturan > Notifikasi.' },
      { type: 'baru', text: 'Peringatan saat budget kategori mencapai 80% dan 100%, sebagai notifikasi di aplikasi HP atau pesan di dalam aplikasi web.' },
      { type: 'baru', text: 'Widget Qala Saku untuk layar utama iOS dan Android: sisa jatah hari ini sekilas, dan tombol + Catat untuk langsung mencatat transaksi.' },
      { type: 'baru', text: 'Pengingat yang sama kini bisa sampai lewat browser dan aplikasi web yang dipasang, juga saat Qala Saku ditutup. Nyalakan di Pengaturan > Notifikasi. Di iPhone, tambahkan Qala Saku ke Layar Utama dulu.' },
      { type: 'baru', text: 'Tombol "Kirim notifikasi uji" di Pengaturan > Notifikasi untuk memastikan notifikasi sampai ke perangkatmu.' },
      { type: 'peningkatan', text: 'Pengingat mencatat jam 20.00 di browser tidak dikirim lagi kalau hari itu sudah ada transaksi, dari perangkat mana pun.' },
      { type: 'peningkatan', text: 'Peringatan budget 80% dan 100% kini juga sampai lewat notifikasi browser begitu pengeluaran dicatat, termasuk dari perangkat lain atau asisten AI.' },
    ],
  },
  {
    version: '2026.10.26',
    date: '2026-10-26',
    title: 'Beranda baru, warna & tema, hapus item saat memeriksa transaksi',
    items: [
      { type: 'baru', text: 'Pilih warna aksen aplikasi di Pengaturan > Tampilan: teal, biru, ungu, merah muda, oranye, atau hijau.' },
      { type: 'baru', text: 'Pengguna PRO bisa memilih tema Minimal, Lembut, atau Kontras selain tema Klasik.' },
      { type: 'baru', text: 'Tema Islami (hijau zamrud & emas, motif geometris, salam) dan tema Kartun (ceria, garis tebal, ditemani Tupi si tupai penabung yang bergerak) untuk pengguna PRO.' },
      { type: 'perbaikan', text: 'Sisa jatah hari ini tidak lagi menghitung budget tabungan. Kategori lain bisa dikeluarkan dari jatah harian lewat Pengaturan > Kategori.' },
      { type: 'baru', text: 'Beranda kini menampilkan pemasukan dan pengeluaran dibanding periode lalu, grafik pengeluaran harian, ke mana uangmu pergi, budget yang paling cepat habis, dan transaksi rutin 14 hari ke depan.' },
      { type: 'peningkatan', text: 'Saat memeriksa beberapa transaksi dari asisten AI atau scan struk, item yang salah atau berlebih kini bisa dihapus sebelum disimpan.' },
      { type: 'perbaikan', text: 'Pembaruan keamanan: Next.js dan pustaka pendukung lainnya diperbarui untuk menutup celah keamanan yang dilaporkan.' },
    ],
  },
  {
    version: '2026.10.18',
    date: '2026-10-18',
    title: 'Animasi saat aplikasi dibuka',
    items: [
      { type: 'peningkatan', text: 'Logo Qala Saku beranimasi tampil saat aplikasi dibuka sampai akunmu siap, tidak langsung kerangka kosong.' },
    ],
  },
  {
    version: '2026.10.14',
    date: '2026-10-14',
    title: 'Pengingat PRO di aplikasi',
    items: [
      { type: 'peningkatan', text: 'Di aplikasi iOS dan Android, menu Lainnya kini mengingatkan saat PRO tinggal 14 hari atau kurang.' },
    ],
  },
  {
    version: '2026.10.13',
    date: '2026-10-13',
    title: 'PRO berlangganan, laporan & patungan lebih rapi',
    items: [
      { type: 'baru', text: 'PRO kini dibayar per periode: Rp 9.000 per bulan atau Rp 89.000 per tahun, tanpa tagihan otomatis. Masa baru ditambahkan setelah sisa masa PRO yang masih berjalan.' },
      { type: 'peningkatan', text: 'Pembeli PRO sebelumnya mendapat PRO gratis 12 bulan; setelah itu bisa diperpanjang dari halaman Upgrade.' },
      { type: 'baru', text: 'Nama teman dari hutang/piutang sebelumnya muncul sebagai saran saat mengisi Patungan dan hutang baru.' },
      { type: 'peningkatan', text: 'Tombol Patungan, Transaksi rutin, dan Scan struk di halaman Transaksi kini ada tulisannya.' },
      { type: 'perbaikan', text: 'Tanggal hutang/piutang yang dicatat tanpa akun kini tersimpan, tidak lagi berubah jadi hari ini.' },
      { type: 'baru', text: 'Hutang dan piutang bisa diubah lewat menu ⋮: nama, nominal, tanggal, jatuh tempo, dan catatan.' },
      { type: 'peningkatan', text: 'Hutang yang lewat jatuh tempo tampil paling atas; yang sudah lunas tampil ringkas di bawah.' },
      { type: 'peningkatan', text: 'Form hutang langsung memilih akun pertama dan menunjukkan saldo mana yang bertambah atau berkurang.' },
      { type: 'peningkatan', text: 'Patungan: alasan tombol Simpan belum aktif tampil di dekatnya, bagian "Saya" langsung terisi kategori terakhir, dan Bagi rata kini berupa tombol.' },
      { type: 'perbaikan', text: 'Layar tidak lagi membesar sendiri di iPhone saat mengisi form, termasuk patungan dan hutang piutang.' },
      { type: 'peningkatan', text: 'Laporan lebih rapi saat kategorinya banyak: donut dengan total di tengah dan daftar semua kategori, serta budget per kategori sebagai bar sisa/lebih.' },
      { type: 'perbaikan', text: 'Menu Lainnya kini menampilkan sisa hari PRO gratis untuk akun baru.' },
    ],
  },
  {
    version: '2026.10.08',
    date: '2026-10-08',
    title: 'Beranda ala aplikasi',
    items: [
      { type: 'baru', text: 'Akun baru langsung dapat PRO gratis 14 hari: scan struk, asisten AI, laporan lengkap, dan akun maupun budget tanpa batas.' },
      { type: 'perbaikan', text: 'Aplikasi yang dipasang di layar utama tidak lagi terbuka putih kosong: logo Qala Saku beranimasi tampil sampai Beranda siap.' },
      { type: 'peningkatan', text: 'Beranda baru: kartu saldo dengan sisa jatah hari ini, tombol cepat (Catat, Scan struk, Patungan, Hutang, Target), dan akun yang bisa digeser. Grafik pindah ke Laporan.' },
      { type: 'baru', text: 'Sembunyikan saldo dengan ikon mata di Beranda; pilihan diingat di perangkat ini.' },
      { type: 'perbaikan', text: 'Aplikasi yang dipasang di layar utama kini langsung membuka Beranda, bukan halaman depan website.' },
      { type: 'peningkatan', text: 'Halaman depan baru: video animasi 3D jadi latar yang berputar saat digulir, dengan kartu fitur dari Catat, Semua akun, Budget, Patungan sampai Target.' },
    ],
  },
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
      { type: 'baru', text: 'PRO: catat transaksi lewat chat atau suara di Asisten, misalnya "catat makan siang 25rb pakai Dompet"; periksa dulu sebelum disimpan.' },
      { type: 'baru', text: 'Hutang & piutang (menu Lainnya): catat pinjaman dan cicilannya; kalau dipilih akunnya, saldo ikut berubah tanpa dihitung sebagai pemasukan atau pengeluaran.' },
      { type: 'peningkatan', text: 'Pencarian dari tombol kaca pembesar di atas: cari transaksi di semua waktu berdasarkan catatan, tag, nama kategori, atau nominal (mis. "25rb").' },
      { type: 'baru', text: 'Rollover budget: nyalakan "Bawa sisa ke periode berikutnya" di detail budget, dan sisa yang tidak terpakai menambah budget periode depan. Budget baru ikut pilihan periode sebelumnya.' },
      { type: 'baru', text: 'Foto struk yang di-scan disimpan bersama transaksinya. Buka transaksi untuk melihat, mengganti, atau melampirkan foto struk; transaksi berfoto ditandai ikon klip.' },
      { type: 'baru', text: 'Bagi tagihan (tombol di halaman Transaksi): bagi satu tagihan ke beberapa kategori, dan bagian teman langsung tercatat sebagai piutang.' },
      { type: 'baru', text: 'Ringkasan tahunan (menu Lainnya): jumlah transaksi, persen yang ditabung, kategori terbesar, bulan paling hemat, dan pengeluaran terbesar, lengkap dengan tombol Bagikan.' },
      { type: 'baru', text: 'Kunci aplikasi dengan PIN 6 angka (Pengaturan → Keamanan), bisa juga dibuka dengan sidik jari atau Face ID. Terkunci lagi setelah 1 menit di latar belakang.' },
      { type: 'baru', text: 'Aplikasi tersedia dalam bahasa Inggris: ganti bahasa di Pengaturan, menu profil, atau halaman Masuk.' },
      { type: 'baru', text: 'PRO: saat mencatat transaksi, muncul saran kategori dan tag dari catatanmu, berdasarkan transaksi sebelumnya dan nama kategori.' },
      { type: 'baru', text: 'Aplikasi bisa dibuka tanpa internet dengan data terakhir; transaksi yang dicatat atau dihapus saat offline tersinkron otomatis saat online.' },
      { type: 'peningkatan', text: 'Form terbuka dari bawah layar dan konfirmasi tampil sebagai kartu kecil.' },
      { type: 'peningkatan', text: 'Landing page baru dengan gaya editorial gelap.' },
      { type: 'peningkatan', text: 'Halaman aplikasi lebih ringan: JavaScript yang diunduh berkurang sekitar 25–40%, sehingga lebih cepat dibuka di HP.' },
      { type: 'perbaikan', text: 'Halaman yang belum sempat dibuka, seperti Budget dan Akun, kini juga bisa dibuka saat offline.' },
      { type: 'perbaikan', text: 'Edit dan hapus transaksi kembali berfungsi.' },
      { type: 'perbaikan', text: 'Periode budget yang dimulai di tanggal gajian (mis. 26) kini dipakai di semua halaman: Beranda, Transaksi ("Periode ini"), Budget, dan Laporan, lengkap dengan rentang tanggalnya.' },
      { type: 'perbaikan', text: 'Saat tanggal mulai periode diganti, transaksi lama ikut pindah ke periode yang sesuai; yang bulan budget-nya diubah manual tidak disentuh.' },
      { type: 'perbaikan', text: 'Scan struk bisa memakai foto dari galeri, tidak hanya kamera.' },
      { type: 'peningkatan', text: 'Scan struk juga membaca screenshot mutasi bank atau e-wallet, lengkap dengan tanggal dan jenis tiap transaksi.' },
      { type: 'perbaikan', text: 'Saldo, sisa budget, laporan, dan ringkasan langsung diperbarui setelah transaksi dicatat lewat tombol +, tanpa perlu muat ulang.' },
      { type: 'perbaikan', text: 'Tombol + kini menampilkan akun dan kategori di semua halaman, termasuk saat aplikasi dibuka langsung di Budget atau Laporan.' },
      { type: 'perbaikan', text: 'Total budget ikut berubah saat batas kategori diubah, ditambah, atau dihapus.' },
      { type: 'perbaikan', text: 'Laporan, budget, dan ekspor CSV menghitung semua transaksi; sebelumnya berhenti di 1.000 transaksi.' },
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
