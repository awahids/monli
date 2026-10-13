import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IncomeZakat } from "@/components/marketing/income-zakat";
import { BRAND } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/plans";
import { INCOME_NISAB_MONTHLY, INCOME_NISAB_YEAR, calcIncomeZakat, toIDR } from "@/lib/zakat";

const PATH = "/panduan/cara-menghitung-zakat-penghasilan";
const UPDATED = "2026-10-13";
const title = "Cara Menghitung Zakat Penghasilan: Rumus, Nisab, Contoh";
const description = `Zakat penghasilan 2,5% dari gaji kotor bila mencapai nisab BAZNAS ${INCOME_NISAB_YEAR}, ${toIDR(INCOME_NISAB_MONTHLY)} per bulan. Lihat contoh dan hitung langsung dengan kalkulator gratis.`;

export const metadata: Metadata = {
  title: `${title} — ${BRAND.name}`,
  description,
  alternates: { canonical: PATH },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}${PATH}`,
    siteName: BRAND.name,
    type: "article",
    locale: "id_ID",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const EXAMPLES = [5_000_000, 7_640_144, 10_000_000, 15_000_000, 25_000_000];

const FAQS = [
  {
    q: `Berapa nisab zakat penghasilan ${INCOME_NISAB_YEAR}?`,
    a: `${toIDR(INCOME_NISAB_MONTHLY)} per bulan atau ${toIDR(INCOME_NISAB_MONTHLY * 12)} per tahun, setara 85 gram emas 14 karat, sesuai SK Ketua BAZNAS No. 15 Tahun 2026 yang berlaku sejak 21 Februari 2026.`,
  },
  {
    q: "Berapa persen zakat penghasilan?",
    a: "2,5% dari penghasilan kotor (bruto) yang mencapai nisab.",
  },
  {
    q: "Gaji di bawah nisab, apakah tetap harus berzakat?",
    a: "Belum wajib zakat penghasilan. Kamu tetap bisa bersedekah atau berinfak dengan nominal berapa pun.",
  },
  {
    q: "Apakah THR dan bonus ikut dihitung?",
    a: "Ya. Penghasilan tidak rutin seperti THR, bonus, atau honor proyek termasuk penghasilan, jadi ikut dihitung di bulan diterimanya.",
  },
  {
    q: "Apakah zakat penghasilan bisa mengurangi pajak?",
    a: "Bisa. Zakat yang dibayar lewat BAZNAS atau LAZ resmi dapat dikurangkan dari penghasilan kena pajak (UU No. 23 Tahun 2011 Pasal 22), dengan menyimpan bukti setor zakatnya.",
  },
];

const SOURCES = [
  {
    label: "BAZNAS — Nisab Zakat Penghasilan dan Jasa 2026 Rp7.640.144 per bulan",
    url: "https://baznas.go.id/news-show/BAZNAS_RI_Tetapkan_Nisab_Zakat_Penghasilan_dan_Jasa_2026_Rp7.640.144_per_bulan/3777",
  },
  {
    label: "Kompas — Baznas Tetapkan Nisab Zakat Penghasilan 2026",
    url: "https://nasional.kompas.com/read/2026/02/25/15103651/baznas-tetapkan-nisab-zakat-penghasilan-2026-rp-7640144-per-bulan",
  },
  {
    label: "ANTARA — Baznas RI tetapkan nisab zakat penghasilan 2026",
    url: "https://www.antaranews.com/berita/5437014/baznas-ri-tetapkan-nisab-zakat-penghasilan-2026-rp7640144-per-bulan",
  },
  { label: "Hukumonline — Ketentuan zakat profesi di Indonesia", url: "https://www.hukumonline.com/klinik/a/ketentuan-zakat-profesi-di-indonesia-lt699e5e0531cd1/" },
  { label: "NU Online — Cara menghitung zakat profesi", url: "https://nu.or.id/syariah/cara-menghitung-zakat-profesi-mVtXT" },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: UPDATED,
    dateModified: UPDATED,
    inLanguage: "id-ID",
    mainEntityOfPage: `${BRAND.url}${PATH}`,
    author: { "@type": "Organization", name: BRAND.name, url: BRAND.url },
    publisher: { "@type": "Organization", name: BRAND.family, url: BRAND.familyUrl },
    image: `${BRAND.url}/og-image.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.name, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: "Kalkulator zakat", item: `${BRAND.url}/kalkulator-zakat` },
      { "@type": "ListItem", position: 3, name: "Cara menghitung zakat penghasilan", item: `${BRAND.url}${PATH}` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

const h2 = "mt-14 font-editorial text-2xl font-normal tracking-[-0.01em] text-foreground sm:text-3xl";
const p = "mt-4 font-editorial font-light leading-relaxed text-foreground/80";
const link = "text-foreground underline underline-offset-4 hover:text-primary";
const cell = "border-b border-white/10 px-3 py-2";

function TrialCta() {
  return (
    <div className="mt-10 rounded-2xl border border-primary/40 bg-primary/[0.06] p-6">
      <p className="font-editorial text-lg">Tahu persis penghasilan dan hartamu setiap bulan.</p>
      <p className="mt-2 font-editorial text-sm font-light text-foreground/75">
        {BRAND.name} mencatat gaji, pengeluaran, dan saldo semua rekening, jadi menghitung zakat tinggal melihat angkanya.
      </p>
      <Button asChild className="mt-4 rounded-full font-editorial">
        <Link href="/auth/sign-up">
          Coba gratis {TRIAL_DAYS} hari <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function IncomeZakatGuide() {
  return (
    <main className="landing-grain relative overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <nav aria-label="Breadcrumb" className="font-editorial text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <Link href="/kalkulator-zakat" className="hover:text-foreground">
            Kalkulator zakat
          </Link>{" "}
          / <span className="text-foreground/80">Panduan</span>
        </nav>
        <h1 className="mt-6 font-editorial text-4xl font-normal leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          Cara menghitung zakat penghasilan
        </h1>
        <p className="mt-4 font-editorial text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Diperbarui <time dateTime={UPDATED}>13 Oktober 2026</time> · nisab BAZNAS {INCOME_NISAB_YEAR}
        </p>
        <p className="mt-8 font-editorial text-lg font-light leading-relaxed text-foreground/85">
          Zakat penghasilan adalah <strong className="font-medium text-foreground">2,5% dari gaji kotor per bulan</strong>, wajib
          bila gaji itu mencapai nisab. Untuk {INCOME_NISAB_YEAR}, BAZNAS menetapkan nisabnya{" "}
          <strong className="font-medium text-foreground">{toIDR(INCOME_NISAB_MONTHLY)} per bulan</strong>. Jadi gaji Rp 10.000.000
          berzakat {toIDR(calcIncomeZakat(10_000_000).amount)} per bulan, sedangkan gaji Rp 7.000.000 belum wajib.
        </p>

        <h2 className={h2}>Apa itu zakat penghasilan</h2>
        <p className={p}>
          Zakat penghasilan, sering juga disebut zakat profesi, adalah zakat atas uang yang kamu terima dari bekerja: gaji, upah,
          honor, komisi, atau jasa sebagai pekerja lepas. Fatwa MUI No. 3 Tahun 2003 dan Peraturan Menteri Agama No. 31 Tahun 2019
          menetapkan nisabnya setara 85 gram emas per tahun dengan kadar 2,5%.
        </p>
        <p className={p}>
          Berbeda dengan zakat maal, zakat penghasilan tidak menunggu satu tahun (haul). Zakatnya dibayar setiap kali penghasilan
          diterima, biasanya bulanan.
        </p>

        <h2 className={h2}>Nisab dan tarif {INCOME_NISAB_YEAR}</h2>
        <p className={p}>
          BAZNAS menetapkan nisab zakat penghasilan dan jasa {INCOME_NISAB_YEAR} sebesar {toIDR(INCOME_NISAB_MONTHLY)} per bulan atau{" "}
          {toIDR(INCOME_NISAB_MONTHLY * 12)} per tahun, lewat SK Ketua BAZNAS No. 15 Tahun 2026 yang berlaku sejak 21 Februari 2026.
          Angka ini setara 85 gram emas 14 karat dengan harga rata-rata emas sepanjang 2025, naik sekitar 7% dari tahun sebelumnya.
        </p>
        <p className={p}>
          Kenapa 14 karat? BAZNAS memakai emas 14 karat sebagai acuan nisab penghasilan, sehingga angkanya jauh lebih rendah daripada
          bila memakai emas murni 24 karat. Pilihan ini masih diperdebatkan sebagian ahli, tetapi inilah angka resmi yang dipakai
          BAZNAS dan lembaga amil di Indonesia saat ini.
        </p>

        <h2 className={h2}>Rumus dan contoh perhitungan</h2>
        <p className={p}>Rumusnya sederhana:</p>
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 font-editorial text-base">
          Zakat penghasilan = 2,5% × penghasilan kotor per bulan, bila penghasilan ≥ {toIDR(INCOME_NISAB_MONTHLY)}
        </p>
        <p className={p}>
          Contoh: Rina bergaji Rp 15.000.000 per bulan. Angka itu melewati nisab, jadi zakatnya 2,5% × Rp 15.000.000 ={" "}
          {toIDR(calcIncomeZakat(15_000_000).amount)} per bulan, atau {toIDR(calcIncomeZakat(15_000_000).amount * 12)} setahun.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[420px] font-editorial text-sm">
            <caption className="sr-only">Contoh zakat penghasilan per bulan</caption>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className={cell}>Penghasilan kotor / bulan</th>
                <th scope="col" className={cell}>Status</th>
                <th scope="col" className={`${cell} text-right`}>Zakat / bulan</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((income) => {
                const z = calcIncomeZakat(income);
                return (
                  <tr key={income}>
                    <td className={`${cell} tabular-nums`}>{toIDR(income)}</td>
                    <td className={cell}>{z.obligatory ? "Wajib" : "Belum wajib"}</td>
                    <td className={`${cell} text-right tabular-nums`}>{toIDR(z.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section aria-labelledby="calc-title" className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <h2 id="calc-title" className="font-editorial text-xl">
            Hitung zakat penghasilanmu
          </h2>
          <p className="mb-5 mt-1 font-editorial text-sm font-light text-foreground/65">
            Masukkan gaji kotor per bulan. Untuk zakat dari tabungan dan emas, pakai{" "}
            <Link href="/kalkulator-zakat" className={link}>
              kalkulator zakat maal
            </Link>
            .
          </p>
          <IncomeZakat />
        </section>

        <TrialCta />

        <h2 className={h2}>Penghasilan kotor atau bersih?</h2>
        <p className={p}>
          BAZNAS menghitung zakat penghasilan dari penghasilan kotor (bruto), yaitu sebelum dikurangi kebutuhan pokok atau cicilan.
          Kalkulator di halaman ini juga memakai cara tersebut.
        </p>
        <p className={p}>
          Sebagian ulama membolehkan menghitung dari penghasilan bersih setelah kebutuhan pokok, terutama bagi yang tanggungannya
          besar. Bila kamu ragu, tanyakan ke lembaga amil tempat kamu menyalurkan zakat.
        </p>

        <h2 className={h2}>Zakat penghasilan vs zakat maal</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] font-editorial text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className={cell}></th>
                <th scope="col" className={cell}>Zakat penghasilan</th>
                <th scope="col" className={cell}>Zakat maal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${cell} text-left font-normal text-muted-foreground`}>Objek</th>
                <td className={cell}>Gaji, honor, jasa</td>
                <td className={cell}>Tabungan, emas, piutang, persediaan dagang</td>
              </tr>
              <tr>
                <th scope="row" className={`${cell} text-left font-normal text-muted-foreground`}>Nisab</th>
                <td className={cell}>{toIDR(INCOME_NISAB_MONTHLY)} / bulan ({INCOME_NISAB_YEAR})</td>
                <td className={cell}>85 gram emas</td>
              </tr>
              <tr>
                <th scope="row" className={`${cell} text-left font-normal text-muted-foreground`}>Waktu</th>
                <td className={cell}>Setiap menerima penghasilan</td>
                <td className={cell}>Setelah tersimpan satu tahun (haul)</td>
              </tr>
              <tr>
                <th scope="row" className={`${cell} text-left font-normal text-muted-foreground`}>Kadar</th>
                <td className={cell}>2,5%</td>
                <td className={cell}>2,5%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={p}>
          Gaji yang sudah dizakati lalu ditabung bisa terkena zakat maal lagi bila tabungannya mencapai nisab dan tersimpan setahun.
        </p>

        <h2 className={h2}>Ke mana menyalurkan zakat</h2>
        <p className={p}>
          Salurkan lewat BAZNAS atau Lembaga Amil Zakat (LAZ) resmi, langsung maupun lewat potongan gaji di kantor. Simpan bukti setor
          zakatnya: zakat yang dibayar ke BAZNAS atau LAZ resmi dapat dikurangkan dari penghasilan kena pajak (UU No. 23 Tahun 2011
          Pasal 22).
        </p>

        <h2 className={h2}>Pertanyaan umum</h2>
        <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-editorial text-base">{f.q}</dt>
              <dd className="mt-2 font-editorial text-sm font-light leading-relaxed text-foreground/75">{f.a}</dd>
            </div>
          ))}
        </dl>

        <TrialCta />

        <p className="mt-10 font-editorial text-xs leading-relaxed text-muted-foreground">
          Panduan ini bersifat umum. Untuk kasus khusus, konsultasikan dengan lembaga amil zakat resmi atau ulama setempat. Nisab
          ditinjau setiap tahun oleh BAZNAS; halaman ini diperbarui saat angka baru terbit.
        </p>

        <h2 className="mt-10 font-editorial text-sm uppercase tracking-[0.2em] text-muted-foreground">Sumber</h2>
        <ul className="mt-3 space-y-1.5 font-editorial text-sm">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className={link}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 font-editorial text-sm text-muted-foreground">
          Lainnya:{" "}
          <Link href="/kalkulator-zakat" className={link}>
            Kalkulator zakat
          </Link>
          {" · "}
          <Link href="/" className={link}>
            {BRAND.name}
          </Link>
        </p>
      </article>
    </main>
  );
}
