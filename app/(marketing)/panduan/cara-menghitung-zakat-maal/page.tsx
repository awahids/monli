import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import ZakatCalculator from "@/app/(dashboard)/zakat/zakat-calculator";
import { BRAND } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/plans";
import { GOLD_NISAB_GRAMS, calcNisab, calcZakat, toIDR } from "@/lib/zakat";

const PATH = "/panduan/cara-menghitung-zakat-maal";
const UPDATED = "2026-10-13";
const title = "Cara Menghitung Zakat Maal: Nisab, Haul, dan Contoh";
const description =
  "Zakat maal 2,5% dari tabungan, emas, piutang, dan barang dagangan yang mencapai nisab 85 gram emas dan sudah tersimpan setahun. Lihat contoh dan hitung langsung dengan kalkulator gratis.";

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

/** Example gold price for the worked examples; readers enter today's price in the calculator. */
const EXAMPLE_GOLD = 2_000_000;
const EXAMPLE_NISAB = calcNisab(EXAMPLE_GOLD, GOLD_NISAB_GRAMS);
const EXAMPLES = [100_000_000, 170_000_000, 200_000_000, 500_000_000];

const FAQS = [
  {
    q: "Berapa nisab zakat maal?",
    a: `Setara ${GOLD_NISAB_GRAMS} gram emas murni. Nilai rupiahnya mengikuti harga emas saat kamu menghitung; dengan harga ${toIDR(EXAMPLE_GOLD)} per gram, nisabnya ${toIDR(EXAMPLE_NISAB)}.`,
  },
  {
    q: "Apa itu haul?",
    a: "Haul adalah masa kepemilikan satu tahun hijriah. Harta baru wajib dizakati bila sudah mencapai nisab dan dimiliki selama satu tahun.",
  },
  {
    q: "Apakah gaji dizakati setiap bulan?",
    a: "Tidak. Gaji tidak dizakati per bulan. Sisa gaji yang kamu simpan menjadi bagian dari harta, lalu dihitung bersama tabungan dan aset lain saat haul tiba.",
  },
  {
    q: "Bagaimana kalau hartaku di bawah nisab?",
    a: "Belum wajib zakat maal. Kamu tetap bisa bersedekah atau berinfak dengan nominal berapa pun.",
  },
  {
    q: "Apakah zakat bisa mengurangi pajak?",
    a: "Bisa. Zakat yang dibayar lewat BAZNAS atau LAZ resmi dapat dikurangkan dari penghasilan kena pajak (UU No. 23 Tahun 2011 Pasal 22), dengan menyimpan bukti setor zakatnya.",
  },
];

const SOURCES = [
  { label: "Tirto — Kalkulator Zakat Maal", url: "https://tirto.id/kalkulator-zakat-maal" },
  { label: "detikHikmah — Kalkulator Zakat", url: "https://www.detik.com/hikmah/kalkulator-zakat" },
  { label: "UMS — What Is Zakat Mal?", url: "https://www.ums.ac.id/en/news/sermon/zakat-mal-rules-and-requirements" },
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
      { "@type": "ListItem", position: 3, name: "Cara menghitung zakat maal", item: `${BRAND.url}${PATH}` },
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
      <p className="font-editorial text-lg">Tahu persis total hartamu kapan pun haul tiba.</p>
      <p className="mt-2 font-editorial text-sm font-light text-foreground/75">
        {BRAND.name} mencatat saldo semua rekening, e-wallet, dan piutangmu, jadi menghitung zakat maal tinggal melihat angkanya.
      </p>
      <Button asChild className="mt-4 rounded-full font-editorial">
        <Link href="/auth/sign-up">
          Coba gratis {TRIAL_DAYS} hari <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function MaalZakatGuide() {
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
          Cara menghitung zakat maal
        </h1>
        <p className="mt-4 font-editorial text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Diperbarui <time dateTime={UPDATED}>13 Oktober 2026</time>
        </p>
        <p className="mt-8 font-editorial text-lg font-light leading-relaxed text-foreground/85">
          Zakat maal adalah <strong className="font-medium text-foreground">2,5% dari seluruh harta</strong> yang mencapai nisab{" "}
          {GOLD_NISAB_GRAMS} gram emas dan sudah dimiliki satu tahun (haul). Dengan harga emas {toIDR(EXAMPLE_GOLD)} per gram, harta
          bersih {toIDR(200_000_000)} yang sudah setahun wajib dizakati {toIDR(calcZakat(200_000_000, EXAMPLE_NISAB).amount)}.
        </p>

        <h2 className={h2}>Apa itu zakat maal</h2>
        <p className={p}>
          Zakat maal adalah zakat atas harta yang kamu miliki, bukan atas setiap pemasukan. Yang dihitung adalah apa yang tersisa dan
          tersimpan: tabungan, emas, piutang, dan barang dagangan. Karena itu gaji tidak dizakati setiap bulan; sisa gaji yang kamu
          simpan ikut terhitung sebagai harta saat haul tiba.
        </p>

        <h2 className={h2}>Harta yang dihitung</h2>
        <ul className={`${p} list-disc space-y-1.5 pl-5`}>
          <li>Uang tunai, tabungan, deposito, dan saldo e-wallet</li>
          <li>Emas dan perak, dihitung dengan nilai rupiahnya</li>
          <li>Piutang yang bisa ditagih</li>
          <li>Persediaan barang dagangan</li>
        </ul>
        <p className={p}>Kurangi totalnya dengan utang jangka pendek yang jatuh tempo dalam setahun. Hasilnya adalah harta bersih.</p>

        <h2 className={h2}>Nisab dan haul</h2>
        <p className={p}>
          Nisab zakat maal setara {GOLD_NISAB_GRAMS} gram emas murni. Nilai rupiahnya berubah mengikuti harga emas, jadi pakailah harga
          emas per gram di hari kamu menghitung. Dengan harga {toIDR(EXAMPLE_GOLD)} per gram, nisabnya {toIDR(EXAMPLE_NISAB)}.
        </p>
        <p className={p}>
          Haul berarti harta itu sudah dimiliki selama satu tahun hijriah. Cara paling mudah: tetapkan satu tanggal setiap tahun,
          misalnya 1 Ramadan, lalu hitung harta bersihmu di tanggal itu.
        </p>

        <h2 className={h2}>Rumus dan contoh perhitungan</h2>
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 font-editorial text-base">
          Zakat maal = 2,5% × harta bersih, bila harta bersih ≥ nisab dan sudah tersimpan setahun
        </p>
        <p className={p}>Contoh dengan harga emas {toIDR(EXAMPLE_GOLD)} per gram (nisab {toIDR(EXAMPLE_NISAB)}):</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[420px] font-editorial text-sm">
            <caption className="sr-only">Contoh zakat maal</caption>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className={cell}>Harta bersih (sudah setahun)</th>
                <th scope="col" className={cell}>Status</th>
                <th scope="col" className={`${cell} text-right`}>Zakat</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((wealth) => {
                const z = calcZakat(wealth, EXAMPLE_NISAB);
                return (
                  <tr key={wealth}>
                    <td className={`${cell} tabular-nums`}>{toIDR(wealth)}</td>
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
            Hitung zakat maalmu
          </h2>
          <p className="mb-5 mt-1 font-editorial text-sm font-light text-foreground/65">
            Masukkan harga emas hari ini dan hartamu yang sudah tersimpan setahun.
          </p>
          <ZakatCalculator plan="FREE" canUseLivePrice={false} embedded />
        </section>

        <TrialCta />

        <h2 className={h2}>Ke mana menyalurkan zakat</h2>
        <p className={p}>
          Salurkan lewat BAZNAS atau Lembaga Amil Zakat (LAZ) resmi. Simpan bukti setor zakatnya: zakat yang dibayar ke BAZNAS atau
          LAZ resmi dapat dikurangkan dari penghasilan kena pajak (UU No. 23 Tahun 2011 Pasal 22).
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
          Panduan ini bersifat umum. Untuk kasus khusus, konsultasikan dengan lembaga amil zakat resmi atau ulama setempat.
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
