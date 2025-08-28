"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardContent } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

const quotes = [
  {
    quote: "“Monli helps me keep tabs on every rupiah.”",
    author: "Beta User",
  },
  {
    quote: "“Budgeting finally makes sense.”",
    author: "Early Adopter",
  },
  {
    quote: "“Clean design and dark mode—love it.”",
    author: "Night Owl",
  },
];

export function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".testimonial-card", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.2,
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
    <section ref={sectionRef} className="py-24">
      <div className="mx-auto max-w-5xl space-y-8 px-4 text-center">
        <h2 className="text-3xl font-bold">What users say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.author} className="testimonial-card shadow-none">
              <CardContent className="pt-6">
                <p className="text-sm">{q.quote}</p>
                <p className="mt-4 text-sm font-medium">{q.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}