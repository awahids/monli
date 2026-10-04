import type { Metadata } from "next";
import Script from "next/script";

import { Header } from "@/components/site/header";
import { Hero } from "@/components/marketing/hero";
import { TrustSignals } from "@/components/marketing/trust-signals";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { CTABand } from "@/components/marketing/cta-band";
import { Footer } from "@/components/marketing/footer";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} — Budget monthly, track daily`,
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.name} — Budget monthly, track daily`,
    description: BRAND.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
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
      <Header />
      <main className="pb-24">
        <Hero />
        <TrustSignals />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTABand />
      </main>
      <Footer />
    </>
  );
}
