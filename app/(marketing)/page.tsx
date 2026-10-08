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
import { cn } from "@/lib/utils";
import { onest } from "./fonts";

export const metadata: Metadata = {
  title: `${BRAND.name} — Atur bulanan, catat harian`,
  description: BRAND.description,
  openGraph: {
    title: `${BRAND.name} — Atur bulanan, catat harian`,
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
