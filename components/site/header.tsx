"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QalaLogo } from "@/components/brand/qala-mark";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Fitur" },
  { href: "#how-it-works", label: "Cara kerja" },
  { href: "#pricing", label: "Harga" },
  { href: "#faq", label: "Tanya jawab" },
];

/** Landing header: transparent over the hero, solid once the page scrolls. */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center rounded-md" aria-label={`${BRAND.name}, beranda`}>
          <QalaLogo markClassName="h-7" textClassName="text-xl" />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-editorial text-[11px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild className="font-editorial text-sm">
            <Link href="/auth/sign-in">Masuk</Link>
          </Button>
          <Button asChild className="rounded-full font-editorial text-sm">
            <Link href="/auth/sign-up">
              Mulai gratis <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((o) => !o)}
          className="h-10 w-10 md:hidden"
          aria-expanded={open}
          aria-controls="landing-menu"
        >
          <span className="relative block h-3 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 block h-px w-5 bg-current transition-transform duration-300",
                open && "translate-y-1.5 rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 block h-px w-5 bg-current transition-transform duration-300",
                open && "-translate-y-1.5 -rotate-45"
              )}
            />
          </span>
          <span className="sr-only">{open ? "Tutup menu" : "Buka menu"}</span>
        </Button>
      </div>

      {open && (
        <div id="landing-menu" className="border-t border-white/10 md:hidden">
          <nav aria-label="Navigasi utama" className="mx-auto flex max-w-7xl flex-col px-4 py-4">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-white/5 py-3 font-editorial text-lg"
              >
                <span className="text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/auth/sign-in" onClick={() => setOpen(false)}>
                  Masuk
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
                  Mulai gratis
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
