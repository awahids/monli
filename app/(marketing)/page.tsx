import type { Metadata } from "next";
import Script from "next/script";

import { Header } from "@/components/site/header";
import { Hero } from "@/components/marketing/hero";
import { ScrollVideo } from "@/components/marketing/scroll-video";
import { TrustSignals } from "@/components/marketing/trust-signals";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTABand } from "@/components/marketing/cta-band";
import { Footer } from "@/components/marketing/footer";
import { BRAND } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/plans";
import { FAQS } from "@/components/marketing/faq-data";
import { cn } from "@/lib/utils";
import { onest } from "./fonts";

const title = `${BRAND.name} — Aplikasi Catat Keuangan & Budget Bulanan`;
const description = `Catat pemasukan, pengeluaran, dan budget bulanan dari semua rekening dan e-wallet. Coba semua fitur PRO gratis ${TRIAL_DAYS} hari, tanpa kartu kredit.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  // A page's openGraph replaces the layout's whole object, so it repeats url, site name and locale.
  openGraph: {
    title,
    description,
    url: BRAND.url,
    siteName: BRAND.name,
    type: "website",
    locale: "id_ID",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.family,
    url: BRAND.familyUrl,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    alternateName: BRAND.formerName,
    url: BRAND.url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    publisher: { "@type": "Organization", name: BRAND.family, url: BRAND.familyUrl },
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function LandingPage() {
  return (
    <>
      <Script
        src="https://analytics.umami.is/script.js"
        data-website-id="umami-landing"
        strategy="lazyOnload"
      />
      <Script
        id="json-ld"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>
      {/* Always-dark editorial scope: .dark switches component tokens, .landing deepens them to ink. */}
      <div className={cn(onest.variable, "dark landing min-h-screen bg-background text-foreground")}>
        <Header />
        <main>
          <Hero />
          <ScrollVideo />
          <TrustSignals />
          <HowItWorks />
          <Pricing />
          <FAQ />
          <CTABand />
        </main>
        <Footer />
      </div>
    </>
  );
}
