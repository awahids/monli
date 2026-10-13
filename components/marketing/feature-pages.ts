import { TRIAL_DAYS } from '@/lib/plans';

/** Public feature pages at /fitur/[slug], written for the searches they answer. */
export type FeaturePage = {
  slug: string;
  /** <title>, keyword first. */
  title: string;
  description: string;
  kicker: string;
  h1: string;
  intro: string;
  image: { src: string; alt: string; width: number; height: number };
  steps: { title: string; body: string }[];
  benefits: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: 'patungan',
    title: 'Aplikasi Patungan & Split Bill Gratis',
    description:
      'Bagi tagihan makan bareng atau liburan dalam hitungan detik. Bagianmu masuk pengeluaran, bagian teman otomatis jadi piutang. Teman tidak perlu pasang aplikasi.',
    kicker: 'Fitur · Patungan',
    h1: 'Patungan tanpa ribet, piutang tercatat otomatis.',
    intro:
      'Satu orang membayar, semua ikut menikmati, lalu siapa yang belum transfer terlupa. Patungan di Qala Saku membagi tagihan dalam beberapa ketukan: bagianmu dicatat sebagai pengeluaran per kategori, bagian setiap teman langsung jadi piutang yang bisa kamu tagih dan tandai lunas.',
    image: {
      src: '/fitur/patungan.png',
      alt: 'Form Patungan di Qala Saku: total tagihan Rp 300.000 dibagi rata untuk saya dan dua teman',
      width: 390,
      height: 844,
    },
    steps: [
      { title: 'Isi total tagihan', body: 'Masukkan total struk dan akun yang dipakai membayar: rekening, e-wallet, atau tunai.' },
      { title: 'Tambahkan teman', body: 'Tulis nama teman yang ikut. Nama yang pernah dicatat muncul sebagai saran, jadi tidak tercatat ganda.' },
      { title: 'Bagi rata atau atur sendiri', body: 'Ketuk Bagi rata, atau isi nominal masing-masing. Sisa yang belum dibagi selalu terlihat di dekat tombol Simpan.' },
      { title: 'Simpan', body: 'Saldo akun berkurang sebesar total tagihan. Bagianmu masuk pengeluaran, bagian teman masuk daftar piutang.' },
    ],
    benefits: [
      { title: 'Budget tetap jujur', body: 'Hanya bagianmu yang dihitung sebagai pengeluaran, jadi budget makan tidak jebol karena kamu menalangi teman.' },
      { title: 'Teman tidak perlu aplikasi', body: 'Berbeda dengan fitur split bill dompet digital, teman cukup transfer seperti biasa. Kamu yang mencatat.' },
      { title: 'Tagihan tidak terlupa', body: 'Setiap bagian teman muncul di Hutang & piutang. Saat mereka membayar, catat dan saldo akunmu ikut bertambah.' },
      { title: 'Gratis', body: `Patungan tersedia di paket FREE. Akun baru juga mendapat semua fitur PRO gratis ${TRIAL_DAYS} hari.` },
    ],
    faqs: [
      {
        q: 'Apakah teman harus punya aplikasi Qala Saku?',
        a: 'Tidak. Patungan dicatat di akunmu saja. Teman membayar lewat transfer atau tunai seperti biasa, lalu kamu menandai pembayarannya.',
      },
      {
        q: 'Apakah bagian teman ikut terhitung di budget?',
        a: 'Tidak. Hanya bagianmu yang masuk pengeluaran dan budget. Bagian teman dicatat sebagai piutang, bukan belanja.',
      },
      {
        q: 'Bagaimana kalau teman baru membayar sebagian?',
        a: 'Catat pembayaran sebagian di Hutang & piutang. Sisanya tetap terlihat sampai lunas, dan pembayaran yang salah bisa dibatalkan.',
      },
      {
        q: 'Bisa dipakai untuk patungan liburan atau kos?',
        a: 'Bisa. Patungan cocok untuk tagihan apa saja: makan bareng, liburan, listrik kos, atau hadiah bersama.',
      },
    ],
  },
  {
    slug: 'hutang-piutang',
    title: 'Aplikasi Catatan Hutang Piutang Gratis',
    description:
      'Catat uang yang kamu pinjam dan pinjamkan, cicilannya, dan jatuh temponya. Saldo akun ikut bergerak tanpa mengacaukan pemasukan, pengeluaran, dan budget.',
    kicker: 'Fitur · Hutang & piutang',
    h1: 'Catatan hutang piutang yang terhubung ke saldomu.',
    intro:
      'Meminjamkan uang ke teman atau mencicil pinjaman keluarga sering hanya diingat di kepala. Qala Saku mencatat siapa meminjam berapa, kapan jatuh temponya, dan cicilan mana yang sudah dibayar, sambil menjaga saldo rekening tetap cocok dengan kenyataan.',
    image: {
      src: '/fitur/hutang-piutang.png',
      alt: 'Daftar hutang di Qala Saku: yang lewat jatuh tempo tampil paling atas, yang lunas ringkas di bawah',
      width: 390,
      height: 844,
    },
    steps: [
      { title: 'Catat pinjaman', body: 'Pilih Saya meminjam atau Saya meminjamkan, isi nama, nominal, dan jatuh tempo bila ada.' },
      { title: 'Pilih akunnya', body: 'Saldo akun yang dipakai langsung bertambah atau berkurang. Bisa juga hanya dicatat tanpa mengubah saldo.' },
      { title: 'Catat setiap cicilan', body: 'Setiap pembayaran mengurangi sisa dan menggerakkan saldo. Progres cicilan terlihat di kartu.' },
      { title: 'Tandai lunas', body: 'Saat sisanya nol, kartu berubah jadi Lunas dan pindah ke bawah daftar.' },
    ],
    benefits: [
      { title: 'Bukan pemasukan, bukan pengeluaran', body: 'Uang pinjaman tidak dihitung sebagai pemasukan atau belanja, jadi laporan dan budget bulananmu tetap bersih.' },
      { title: 'Yang mendesak di atas', body: 'Hutang yang lewat jatuh tempo tampil paling atas, disusul yang jatuh temponya paling dekat.' },
      { title: 'Ringkasan dua arah', body: 'Total hutangmu dan total piutangmu terlihat sekilas di bagian atas halaman.' },
      { title: 'Salah ketik bisa diubah', body: 'Nama, nominal, tanggal, dan jatuh tempo bisa diubah kapan saja; saldo menyesuaikan selisihnya.' },
    ],
    faqs: [
      {
        q: 'Apakah uang pinjaman dihitung sebagai pemasukan?',
        a: 'Tidak. Pinjaman dan cicilannya menggerakkan saldo akun, tetapi tidak dihitung sebagai pemasukan atau pengeluaran, jadi budget dan laporan tidak terganggu.',
      },
      {
        q: 'Bisa mencatat cicilan?',
        a: 'Bisa. Catat setiap pembayaran; sisa dan progresnya diperbarui otomatis. Pembayaran tidak bisa melebihi sisa yang belum dibayar.',
      },
      {
        q: 'Bagaimana kalau pinjamannya tunai atau tidak lewat rekening?',
        a: 'Pilih Tanpa akun (hanya dicatat). Hutangnya tetap tercatat lengkap dengan tanggal dan jatuh tempo, tanpa mengubah saldo akun mana pun.',
      },
      {
        q: 'Apakah fitur ini gratis?',
        a: `Ya, Hutang & piutang tersedia di paket FREE. Akun baru juga mendapat semua fitur PRO gratis ${TRIAL_DAYS} hari.`,
      },
    ],
  },
];

export const featurePage = (slug: string) => FEATURE_PAGES.find((p) => p.slug === slug);
