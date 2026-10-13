"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { track } from '@/lib/analytics';
import { FAQS as faqs } from './faq-data';


export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-16 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 border-t border-white/10 pt-6 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              <span className="text-primary">05</span> — Tanya jawab
            </p>
            <h2
              id="faq-title"
              className="mt-4 font-editorial text-3xl font-normal tracking-[-0.015em] sm:text-5xl"
            >
              Pertanyaan umum
            </h2>
            <p className="mt-4 max-w-xs font-editorial text-sm font-light leading-relaxed text-foreground/65">
              Hal yang paling sering ditanyakan sebelum mulai mencatat.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            onValueChange={() => track("faq_toggle")}
          >
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={f.q} className="border-white/10">
                <AccordionTrigger className="gap-4 py-5 text-left font-editorial text-base font-normal hover:no-underline sm:text-lg">
                  <span className="flex items-baseline gap-4">
                    <span className="font-editorial text-xs tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-8 font-editorial text-sm font-light leading-relaxed text-foreground/70">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
