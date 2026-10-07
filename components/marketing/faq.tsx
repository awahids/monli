"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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
    a: "Tentukan batas belanja bulanan per kategori. Qala Saku menghitung sisa budget dan jatah harianmu dari transaksi yang kamu catat. Periode budget bisa dimulai di tanggal gajian, misalnya tanggal 25.",
  },
  {
    q: "Bisa dipakai bersama pasangan atau keluarga?",
    a: "Bisa, dengan paket PRO. Undang hingga 4 orang sebagai Editor (bisa mencatat) atau Pemantau (hanya melihat). Data pribadi mereka tetap terpisah.",
  },
  {
    q: "Apakah dataku aman?",
    a: "Setiap data hanya bisa diakses oleh pemilik akunnya dan orang yang ia undang (row level security di database), dan tidak dibagikan ke pihak lain.",
  },
  {
    q: "Bisa dipakai di HP?",
    a: "Bisa. Qala Saku dirancang untuk layar HP dengan navigasi di bawah, dan bisa dipasang seperti aplikasi (PWA). Tersedia tampilan terang dan gelap.",
  },
  {
    q: "Berapa harga paket PRO?",
    a: "Paket FREE gratis selamanya. PRO saat ini harga promo Rp 9.000 sekali bayar: akun & budget tanpa batas, laporan lengkap, scan struk, asisten AI, dan kelola bersama keluarga.",
  },
];

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
            onValueChange={() => window.umami?.track("faq_toggle")}
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
