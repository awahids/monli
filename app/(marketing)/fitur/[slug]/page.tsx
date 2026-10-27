import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CTABand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FEATURE_PAGES, featurePage } from "@/components/marketing/feature-pages";
import { BRAND } from "@/lib/brand";
import { TRIAL_DAYS } from "@/lib/plans";

export const dynamicParams = false;

export function generateStaticParams() {
  return FEATURE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const page = featurePage(params.slug);
  if (!page) return {};
  const title = `${page.title} — ${BRAND.name}`;
  return {
    title,
    description: page.description,
    alternates: { canonical: `/fitur/${page.slug}` },
    openGraph: {
      title,
      description: page.description,
      url: `${BRAND.url}/fitur/${page.slug}`,
      siteName: BRAND.name,
      type: "website",
      locale: "id_ID",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function FeaturePageRoute(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = featurePage(params.slug);
  if (!page) notFound();
  const others = FEATURE_PAGES.filter((p) => p.slug !== page.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND.name, item: BRAND.url },
        { "@type": "ListItem", position: 2, name: page.title, item: `${BRAND.url}/fitur/${page.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="landing-grain relative overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-16">
        <div aria-hidden className="absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <nav aria-label="Breadcrumb" className="font-editorial text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                {BRAND.name}
              </Link>{" "}
              / <span className="text-foreground/80">{page.kicker.replace("Fitur · ", "")}</span>
            </nav>
            <h1 className="mt-6 font-editorial text-4xl font-normal leading-[1.05] tracking-[-0.02em] sm:text-6xl">{page.h1}</h1>
            <p className="mt-6 max-w-xl font-editorial text-base font-light leading-relaxed text-foreground/75 sm:text-lg">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-7 font-editorial text-base">
                <Link href="/auth/sign-up">
                  Coba gratis {TRIAL_DAYS} hari <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-5 font-editorial text-base">
                <Link href="/#features">Lihat semua fitur</Link>
              </Button>
            </div>
            <p className="mt-5 font-editorial text-xs text-muted-foreground">Gratis di paket FREE · tanpa kartu kredit</p>
          </div>
          <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/40">
            <Image
              src={page.image.src}
              alt={page.image.alt}
              width={page.image.width}
              height={page.image.height}
              sizes="300px"
              priority
              className="h-auto w-full rounded-[1.6rem]"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading index="01" kicker="Cara kerja" id="steps-title" title="Beberapa ketukan, selesai." />
          <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {page.steps.map((s, i) => (
              <li key={s.title} className="border-t border-white/10 pt-5">
                <span className="font-editorial text-3xl font-light tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-editorial text-lg">{s.title}</h3>
                <p className="mt-2 font-editorial text-sm font-light leading-relaxed text-foreground/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="benefits-title" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading index="02" kicker="Kenapa Qala Saku" id="benefits-title" title="Dibuat untuk keuangan sehari-hari." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {page.benefits.map((b) => (
              <li key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="font-editorial text-lg">{b.title}</h3>
                <p className="mt-2 font-editorial text-sm font-light leading-relaxed text-foreground/70">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading index="03" kicker="Tanya jawab" id="faq-title" title="Pertanyaan umum" />
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {page.faqs.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 md:grid-cols-[1fr_1.6fr] md:gap-10">
                <dt className="font-editorial text-base sm:text-lg">{f.q}</dt>
                <dd className="font-editorial text-sm font-light leading-relaxed text-foreground/70">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 font-editorial text-sm text-muted-foreground">
            Lainnya:{" "}
            {[...others.map((o) => ({ href: `/fitur/${o.slug}`, label: o.kicker.replace("Fitur · ", "") })), { href: "/kalkulator-zakat", label: "Kalkulator zakat" }].map((l, i) => (
              <span key={l.href}>
                {i > 0 && " · "}
                <Link href={l.href} className="text-foreground underline-offset-4 hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      <CTABand />
    </main>
  );
}
