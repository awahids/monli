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
    q: "Monli sekarang jadi apa?",
    a: "Monli sekarang bernama Qala Saku, bagian dari keluarga Qala (qala.digital) bersama Qala Invoice. Akun, data, dan alamat monli.fun tetap sama.",
  },
  {
    q: "Apakah perlu menyambungkan rekening bank?",
    a: "Tidak. Kamu mencatat sendiri transaksi dari rekening bank, e-wallet, maupun uang tunai. Untuk pengguna PRO, struk belanja bisa difoto dan dibaca otomatis.",
  },
  {
    q: "Bagaimana cara kerja budget?",
    a: "Tentukan batas belanja bulanan per kategori. Qala Saku menghitung sisa budget dan jatah harianmu dari transaksi yang kamu catat, dan bisa mengisi budget baru dari pengeluaran bulan lalu.",
  },
  {
    q: "Apakah dataku aman?",
    a: "Setiap data hanya bisa diakses oleh pemilik akunnya (row level security di database) dan tidak dibagikan ke pihak lain.",
  },
  {
    q: "Ada mode gelap?",
    a: "Ada. Tampilan terang dan gelap tersedia, atau ikuti pengaturan perangkatmu.",
  },
  { q: "Bisa dipakai di HP?", a: "Bisa. Qala Saku dirancang untuk layar HP dengan navigasi di bawah, dan bisa dipasang seperti aplikasi (PWA)." },
  {
    q: "Berapa harga paket PRO?",
    a: "Paket FREE gratis selamanya. PRO saat ini harga promo Rp 9.000 sekali bayar, untuk akun & budget tanpa batas, laporan lengkap, scan struk, dan asisten AI.",
  },
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
        <h2 className="mb-8 text-center text-3xl font-bold">Pertanyaan umum</h2>
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
