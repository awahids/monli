import { TRIAL_DAYS } from "@/lib/plans";

/** Landing FAQ, also sent to search engines as FAQPage structured data. */
export const FAQS = [
  {
    q: "Monli sekarang jadi apa?",
    a: "Monli sekarang bernama Qala Saku, bagian dari keluarga Qala (qala.digital) bersama Qala Invoice. Akun, data, dan alamat monli.fun tetap sama.",
  },
  {
    q: "Apakah perlu menyambungkan rekening bank?",
    a: "Tidak. Kamu mencatat sendiri transaksi dari rekening bank, e-wallet, maupun uang tunai. Untuk pengguna PRO, struk belanja bisa difoto dan dibaca otomatis.",
  },
  {
    q: "Bagaimana cara kerja budget?",
    a: "Tentukan batas belanja bulanan per kategori. Qala Saku menghitung sisa budget dan jatah harianmu dari transaksi yang kamu catat. Periode budget bisa dimulai di tanggal gajian, misalnya tanggal 25.",
  },
  {
    q: "Bisa dipakai bersama pasangan atau keluarga?",
    a: "Bisa, dengan paket PRO. Undang hingga 4 orang sebagai Editor (bisa mencatat) atau Pemantau (hanya melihat). Data pribadi mereka tetap terpisah.",
  },
  {
    q: "Apakah dataku aman?",
    a: "Setiap data hanya bisa diakses oleh pemilik akunnya dan orang yang ia undang (row level security di database), dan tidak dibagikan ke pihak lain.",
  },
  {
    q: "Bisa dipakai di HP?",
    a: "Bisa. Qala Saku dirancang untuk layar HP dengan navigasi di bawah, dan bisa dipasang seperti aplikasi (PWA). Tersedia tampilan terang dan gelap.",
  },
  {
    q: `Apa itu PRO gratis ${TRIAL_DAYS} hari?`,
    a: `Setiap akun baru langsung mendapat semua fitur PRO selama ${TRIAL_DAYS} hari, tanpa kartu kredit dan tanpa tagihan otomatis. Setelah itu akun kembali ke paket FREE dan semua catatanmu tetap tersimpan, kecuali kamu memilih upgrade.`,
  },
  {
    q: "Berapa harga paket PRO?",
    a: "Paket FREE gratis selamanya. PRO saat ini harga promo Rp 9.000 sekali bayar: akun & budget tanpa batas, laporan lengkap, scan struk, asisten AI, dan kelola bersama keluarga.",
  },
];
