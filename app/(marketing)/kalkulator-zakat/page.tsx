import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing/section-heading";
import { IncomeZakat } from "@/components/marketing/income-zakat";
import ZakatCalculator from "@/app/(dashboard)/zakat/zakat-calculator";
import { BRAND } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/plans";

const title = `Kalkulator Zakat Penghasilan & Zakat Maal Online — ${BRAND.name}`;
const description =
  "Hitung zakat penghasilan bulanan dan zakat maal (tabungan, emas, piutang) secara gratis. Lengkap dengan nisab 85 gram emas, tarif 2,5%, dan contoh perhitungan.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/kalkulator-zakat" },
  openGraph: {
    title,
    description,
    url: `${BRAND.url}/kalkulator-zakat`,
    siteName: BRAND.name,
    type: "website",
    locale: "id_ID",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const FAQS = [
  {
    q: "Berapa nisab zakat penghasilan?",
    a: "Nisab zakat penghasilan setara 85 gram emas per tahun. Bila dibayar bulanan, penghasilan dibandingkan dengan seperduabelas nilai itu. Dengan harga emas Rp 2.000.000 per gram, nisabnya sekitar Rp 14.166.667 per bulan.",
  },
  {
    q: "Berapa persen zakat penghasilan dan zakat maal?",
    a: "Keduanya 2,5%. Zakat penghasilan dihitung dari penghasilan kotor bulanan yang mencapai nisab; zakat maal dari harta yang mencapai nisab dan sudah tersimpan satu tahun (haul).",
  },
  {
    q: "Harta apa saja yang dihitung dalam zakat maal?",
    a: "Uang tunai, tabungan, deposito, saldo e-wallet, emas dan perak, piutang yang bisa ditagih, serta persediaan dagang, dikurangi utang jangka pendek yang jatuh tempo dalam setahun.",
  },
  {
    q: "Harga emas mana yang dipakai?",
    a: "Gunakan harga emas murni terkini per gram di hari kamu menghitung. Hasil kalkulator mengikuti harga yang kamu masukkan.",
  },
  {
    q: "Apakah hasil kalkulator ini pasti benar?",
    a: "Kalkulator ini panduan perhitungan umum. Untuk kasus khusus atau penetapan akhir, konsultasikan dengan lembaga amil zakat resmi atau ulama setempat.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Kalkulator Zakat Qala Saku",
    url: `${BRAND.url}/kalkulator-zakat`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function ZakatCalculatorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="landing-grain relative overflow-hidden pb-16 pt-10 sm:pt-16">
        <div aria-hidden className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Gratis · tanpa daftar
          </p>
          <h1 className="mt-6 max-w-3xl font-editorial text-4xl font-normal leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            Kalkulator zakat penghasilan &amp; zakat maal
          </h1>
          <p className="mt-6 max-w-2xl font-editorial text-base font-light leading-relaxed text-foreground/75 sm:text-lg">
            Hitung zakat dari gaji bulanan atau dari tabungan, emas, dan piutang yang sudah setahun. Masukkan harga emas
            hari ini, dan kalkulator menghitung nisab serta zakat 2,5% untukmu.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="income-title" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 id="income-title" className="font-editorial text-2xl">
                Zakat penghasilan
              </h2>
              <p className="mb-5 mt-1 font-editorial text-sm font-light text-foreground/65">Untuk gaji atau honor, dibayar bulanan.</p>
              <IncomeZakat />
            </section>
            <section aria-labelledby="maal-title" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <h2 id="maal-title" className="font-editorial text-2xl">
                Zakat maal
              </h2>
              <p className="mb-5 mt-1 font-editorial text-sm font-light text-foreground/65">
                Untuk harta yang sudah tersimpan satu tahun (haul).
              </p>
              <ZakatCalculator plan="FREE" canUseLivePrice={false} embedded />
            </section>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-title" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading index="01" kicker="Panduan" id="how-title" title="Cara menghitung zakat" />
          <div className="mt-10 grid gap-10 font-editorial font-light leading-relaxed text-foreground/75 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-normal text-foreground">Zakat penghasilan</h3>
              <p>
                Rumusnya: <strong className="font-medium text-foreground">2,5% × penghasilan kotor per bulan</strong>, bila
                penghasilan itu mencapai nisab bulanan, yaitu nilai 85 gram emas dibagi 12.
              </p>
              <p>
                Contoh: harga emas Rp 2.000.000 per gram, jadi nisab setahun Rp 170.000.000 dan nisab per bulan sekitar
                Rp 14.166.667. Gaji Rp 15.000.000 sudah mencapai nisab, sehingga zakatnya Rp 375.000 per bulan.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-normal text-foreground">Zakat maal</h3>
              <p>
                Jumlahkan uang tunai dan tabungan, emas dan perak, piutang yang bisa ditagih, serta persediaan dagang, lalu
                kurangi utang jangka pendek. Bila hasilnya mencapai nisab 85 gram emas dan sudah tersimpan setahun, zakatnya{" "}
                <strong className="font-medium text-foreground">2,5% dari total harta itu</strong>.
              </p>
              <p>
                Contoh: harta bersih Rp 200.000.000 dengan nisab Rp 170.000.000 sudah wajib zakat, yaitu Rp 5.000.000.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading index="02" kicker="Tanya jawab" id="faq-title" title="Pertanyaan seputar zakat" />
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 md:grid-cols-[1fr_1.6fr] md:gap-10">
                <dt className="font-editorial text-base sm:text-lg">{f.q}</dt>
                <dd className="font-editorial text-sm font-light leading-relaxed text-foreground/70">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary/40 bg-primary/[0.06] px-6 py-12 text-center sm:px-12">
          <h2 className="font-editorial text-3xl sm:text-4xl">Tahu persis hartamu, setiap bulan.</h2>
          <p className="mx-auto mt-4 max-w-xl font-editorial font-light text-foreground/75">
            {BRAND.name} mencatat saldo semua rekening, e-wallet, dan piutangmu, jadi menghitung zakat tinggal melihat angkanya.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full px-8 font-editorial text-base">
            <Link href="/auth/sign-up">
              Coba gratis {TRIAL_DAYS} hari <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
