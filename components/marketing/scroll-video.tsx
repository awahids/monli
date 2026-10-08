"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * The 8 s 3D clip as the page's background: it stays pinned while the feature
 * chapters scroll over it, and scrolling scrubs it. Shipped as 120 WebP frames
 * (15 fps) painted onto a canvas, because seeking a <video> element on every
 * scroll tick stutters badly on iOS Safari.
 */
const FRAME_COUNT = 120;
const BASE = "/landing/promo";
const SRC_W = 1280;
const SRC_H = 720;
/** The "Mulai Gratis" button painted in the last frames, in source pixels. */
const CTA_BOX = { x: 490, y: 608, w: 298, h: 67 };
const HEADER = 64;

type Item = { title: string; text: string; pro?: boolean };
type Chapter = {
  label: string;
  title: string;
  body: string;
  items: Item[];
  frame: number;
};

/** One per chapter of the clip; `frame` is what the background shows while the chapter is on screen. */
const CHAPTERS: Chapter[] = [
  {
    label: "Atur",
    title: "Atur. Catat. Pahami.",
    body: "Satu aplikasi untuk semua urusan uang harianmu, dari mencatat jajan sampai mencapai target.",
    items: [],
    frame: 0,
  },
  {
    label: "Catat",
    title: "Catat dalam hitungan detik.",
    body: "Ketik, ucapkan, atau scan struk. Tag dan kategori menyesuaikan kebiasaanmu.",
    items: [
      {
        title: "Transaksi rutin",
        text: "Gaji, kos, listrik, dan langganan tercatat sendiri setiap jatuh tempo.",
      },
      {
        title: "Scan struk",
        text: "Foto struk dan biarkan Qala Saku membacanya.",
        pro: true,
      },
    ],
    frame: 30,
  },
  {
    label: "Semua akun",
    title: "Semua akun, satu saldo.",
    body: "Rekening bank, e-wallet, dan tunai dalam satu layar. Saldo ikut bergerak setiap kali kamu mencatat.",
    items: [
      {
        title: "Kelola bersama keluarga",
        text: "Undang pasangan atau keluarga, hingga 4 orang.",
        pro: true,
      },
    ],
    frame: 50,
  },
  {
    label: "Budget",
    title: "Budget ikut tanggal gajian.",
    body: "Pilih tanggal mulai periode. Sisa budget dan jatah harian dihitung otomatis, sisanya bisa dibawa ke bulan depan.",
    items: [
      {
        title: "Laporan & asisten AI",
        text: "Tren bulanan, pengeluaran per kategori, dan AI yang menjawab pertanyaan tentang uangmu.",
        pro: true,
      },
    ],
    frame: 69,
  },
  {
    label: "Patungan",
    title: "Patungan tanpa ribet.",
    body: "Bagi tagihan ke teman, bagian mereka langsung tercatat sebagai piutang.",
    items: [
      {
        title: "Hutang & piutang",
        text: "Catat pinjaman dan cicilannya, saldo akun ikut menyesuaikan.",
      },
    ],
    frame: 90,
  },
  {
    label: "Target",
    title: "Wujudkan targetmu.",
    body: "Dana darurat atau liburan: lihat berapa yang perlu disisihkan tiap bulan agar tepat waktu.",
    items: [],
    frame: FRAME_COUNT - 1,
  },
];

const frameSrc = (set: string, i: number) =>
  `${BASE}/${set}/${String(i + 1).padStart(3, "0")}.webp`;

/** Coarse frames first so scrubbing works early, then fill the gaps. */
function loadOrder(): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < FRAME_COUNT; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1);
  return order;
}

type Box = { left: number; top: number; width: number; height: number };

export function ScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const [ready, setReady] = useState(false);
  const [ctaBox, setCtaBox] = useState<Box | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !stage || !canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = window.matchMedia("(min-width: 768px)").matches ? "lg" : "sm";
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(
      null,
    );
    const state = { frame: 0 };
    const last = FRAME_COUNT - 1;
    let drawn = -1;
    let started = false;
    let disposed = false;

    /** Cover-fit of the source frame inside the stage, in CSS pixels. */
    const fit = () => {
      const cw = stage.clientWidth;
      const ch = stage.clientHeight;
      const scale = Math.max(cw / SRC_W, ch / SRC_H);
      return {
        scale,
        dx: (cw - SRC_W * scale) / 2,
        dy: (ch - SRC_H * scale) / 2,
      };
    };

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (force = false) => {
      const idx = nearestLoaded(Math.round(state.frame));
      if (idx < 0 || (idx === drawn && !force)) return;
      const { scale, dx, dy } = fit();
      const dpr = canvas.width / Math.max(stage.clientWidth, 1);
      ctx.drawImage(
        frames[idx]!,
        dx * dpr,
        dy * dpr,
        SRC_W * scale * dpr,
        SRC_H * scale * dpr,
      );
      drawn = idx;
    };

    const update = () => {
      draw();
      setAtEnd(Math.round(state.frame) >= last);
      if (barRef.current)
        barRef.current.style.transform = `scaleX(${state.frame / last})`;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
      const { scale, dx, dy } = fit();
      setCtaBox({
        left: dx + CTA_BOX.x * scale,
        top: dy + CTA_BOX.y * scale,
        width: CTA_BOX.w * scale,
        height: CTA_BOX.h * scale,
      });
      draw(true);
    };

    const load = () => {
      if (started) return;
      started = true;
      for (const i of loadOrder()) {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          if (disposed) return;
          frames[i] = img;
          if (i === 0) setReady(true);
          // Repaint if this frame is closer to the scroll position than what is shown.
          const target = Math.round(state.frame);
          if (drawn < 0 || Math.abs(i - target) < Math.abs(drawn - target))
            draw(true);
        };
        img.src = frameSrc(set, i);
      }
    };

    // Start fetching frames shortly before the section scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(section);

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    const gctx = gsap.context(() => {
      const chapters = gsap.utils.toArray<HTMLElement>(".story-chapter");
      chapters.forEach((el, i) => {
        // While a chapter scrolls up over the previous one, the background plays the stretch between them.
        if (i > 0) {
          gsap.fromTo(
            state,
            { frame: CHAPTERS[i - 1].frame },
            {
              frame: CHAPTERS[i].frame,
              ease: "none",
              immediateRender: false,
              onUpdate: update,
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: `top top+=${HEADER}`,
                scrub: 0.4,
              },
            },
          );
        }
        gsap.from(el.querySelectorAll(".story-rise"), {
          y: 48,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, section);

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      gctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-title"
      className="relative scroll-mt-16 bg-[#EEEAD7] text-[#0D4142]"
    >
      <h2 id="features-title" className="sr-only">
        Fitur Qala Saku
      </h2>

      {/* Pinned background; the chapters below are pulled up over it. */}
      <div
        ref={stageRef}
        className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden"
      >
        <Image
          src={`${BASE}/sm/001.webp`}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-500",
            ready && "opacity-0",
          )}
        />
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animasi Qala Saku: koin emas mengalir dari catat transaksi dan scan struk, ke semua akun, budget, patungan, sampai target tercapai."
          className="absolute inset-0 h-full w-full"
        />
        {ctaBox && (
          <Link
            href="/auth/sign-up"
            tabIndex={atEnd ? 0 : -1}
            aria-hidden={!atEnd}
            aria-label="Mulai sekarang, daftar gratis"
            className={cn(
              "absolute z-10 rounded-full outline-none ring-offset-2 transition-shadow hover:ring-4 hover:ring-primary/30 focus-visible:ring-4 focus-visible:ring-ring",
              !atEnd && "pointer-events-none",
            )}
            style={ctaBox}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1 bg-black/10"
        >
          <div
            ref={barRef}
            className="h-full origin-left scale-x-0 bg-primary"
          />
        </div>
      </div>

      <div className="pointer-events-none relative -mt-[calc(100svh-4rem)]">
        {CHAPTERS.map((c, i) => (
          <article
            key={c.label}
            className="story-chapter flex min-h-[calc(100svh-4rem)] items-end px-4 pb-10 pt-24 md:items-center md:justify-end md:px-12 md:py-16"
          >
            {i === CHAPTERS.length - 1 ? (
              // The clip's own end card shows this title and a "Mulai Gratis" button, made clickable above.
              <div className="sr-only">
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ) : (
              <div className="pointer-events-auto w-full max-w-md space-y-3">
                <div className="story-rise rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md md:bg-white/85 md:p-8">
                  <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-[#0D4142]/70">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(CHAPTERS.length).padStart(2, "0")} · {c.label}
                  </p>
                  <h3 className="mt-2 font-editorial text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[#0D4142]/80">{c.body}</p>
                  {i === 0 && (
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[#0D4142]/60">
                      Gulir untuk menjelajah
                    </p>
                  )}
                </div>
                {c.items.length > 0 && (
                  <ul
                    className={cn(
                      "grid gap-3",
                      c.items.length > 1 && "sm:grid-cols-2",
                    )}
                  >
                    {c.items.map((it) => (
                      <li
                        key={it.title}
                        className="story-rise rounded-2xl bg-white/90 p-4 md:bg-white/75 shadow-lg ring-1 ring-black/5 backdrop-blur-md"
                      >
                        <p className="flex items-center gap-2 font-semibold">
                          {it.title}
                          {it.pro && (
                            <span className="rounded-full bg-[#0D4142] px-2 py-0.5 font-editorial text-[10px] font-medium uppercase tracking-[0.15em] text-[#F2C14E]">
                              PRO
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-[#0D4142]/75">
                          {it.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
