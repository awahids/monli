"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "Can I use with bank & e-wallets?",
    a: "Yes—Monli works with both bank and e-wallet accounts.",
  },
  {
    q: "How do budgets work?",
    a: "Set monthly limits per account with category allocation and rollover.",
  },
  {
    q: "Is my data safe?",
    a: "We use row level security on Supabase and never share your data.",
  },
  {
    q: "Do you support dark mode?",
    a: "Absolutely, light and dark themes are built in.",
  },
  { q: "Mobile support?", a: "Monli is mobile-friendly with a bottom nav on small screens." },
  { q: "What's the intro pricing?", a: "Monli Pro is free during our intro period." },
];

export function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".faq-item", {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">FAQ</h2>
        <Accordion
          type="single"
          collapsible
          onValueChange={() => window.umami?.track("faq_toggle")}
        >
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="faq-item">
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
