"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-scrubbed promo video. The 8 s 3D clip is shipped as 120 WebP frames
 * (15 fps) and painted onto a canvas, because seeking a <video> element on
 * every scroll tick stutters badly on iOS Safari.
 */
const FRAME_COUNT = 120;
const BASE = "/landing/promo";
const SRC_W = 1280;
const SRC_H = 720;
/** Share of the scroll distance that plays the clip; the rest holds the end card. */
const PLAY_SHARE = 0.9;
/** The "Mulai Gratis" button painted in the last frames, in source pixels. */
const CTA_BOX = { x: 490, y: 608, w: 298, h: 67 };
/** First frame of the closing "Wujudkan targetmu" card. */
const END_CARD = 101;

/** One per chapter of the clip; the closing card (END_CARD on) has its own button. */
const CAPTIONS = [
  { from: 0, to: 18, title: "Atur. Catat. Pahami.", body: "Satu aplikasi untuk semua urusan uang harianmu." },
  { from: 19, to: 40, title: "Catat dalam hitungan detik.", body: "Ketik, ucapkan, atau scan struk, transaksi langsung tercatat." },
  { from: 41, to: 59, title: "Semua akun, satu saldo.", body: "Rekening bank, e-wallet, dan tunai terkumpul di satu tempat." },
  { from: 60, to: 78, title: "Budget yang terjaga.", body: "Lihat sisa jatah harianmu, dan bawa sisanya ke bulan depan." },
  { from: 79, to: 100, title: "Patungan tanpa ribet.", body: "Bagi tagihan ke teman, bagian mereka langsung tercatat sebagai piutang." },
];

const frameSrc = (set: string, i: number) => `${BASE}/${set}/${String(i + 1).padStart(3, "0")}.webp`;

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
  const [caption, setCaption] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [endCard, setEndCard] = useState(false);
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
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const state = { frame: 0 };
    let drawn = -1;
    let started = false;
    let disposed = false;

    /** Cover-fit of the source frame inside the stage, in CSS pixels. */
    const fit = () => {
      const cw = stage.clientWidth;
      const ch = stage.clientHeight;
      const scale = Math.max(cw / SRC_W, ch / SRC_H);
      return { cw, ch, scale, dx: (cw - SRC_W * scale) / 2, dy: (ch - SRC_H * scale) / 2 };
    };

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const draw = (force = false) => {
      const target = Math.round(state.frame);
      const idx = nearestLoaded(target);
      if (idx < 0 || (idx === drawn && !force)) return;
      const img = frames[idx]!;
      const { scale, dx, dy } = fit();
      const dpr = canvas.width / Math.max(stage.clientWidth, 1);
      ctx.drawImage(img, dx * dpr, dy * dpr, SRC_W * scale * dpr, SRC_H * scale * dpr);
      drawn = idx;
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
          if (drawn < 0 || Math.abs(i - target) < Math.abs(drawn - target)) draw(true);
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
      { rootMargin: "150% 0px" }
    );
    io.observe(section);

    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    const last = FRAME_COUNT - 1;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top+=64",
        end: "bottom bottom",
        scrub: 0.4,
      },
      onUpdate: () => {
        draw();
        const f = Math.round(state.frame);
        setCaption(CAPTIONS.findIndex((c) => f >= c.from && f <= c.to));
        setAtEnd(f >= last);
        setEndCard(f >= END_CARD);
        if (barRef.current) barRef.current.style.transform = `scaleX(${state.frame / last})`;
      },
    });
    tl.to(state, { frame: last, ease: "none", duration: PLAY_SHARE }).to({}, { duration: 1 - PLAY_SHARE });

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="cerita"
        aria-labelledby="promo-title"
        className="relative h-[320vh] scroll-mt-16 motion-reduce:hidden md:h-[400vh]"
      >
        {/* Full-bleed cream like the clip, so the frames blend into the page on phones too. */}
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden bg-[#EEEAD7]">
          {/* The clip paints this headline itself. */}
          <h2 id="promo-title" className="sr-only">
            Atur. Catat. Pahami.
          </h2>

          <div
            ref={stageRef}
            className="relative aspect-video overflow-hidden bg-[#EEEAD7] md:absolute md:inset-0 md:aspect-auto"
          >
            <Image
              src={`${BASE}/sm/001.webp`}
              alt=""
              aria-hidden
              fill
              sizes="100vw"
              className={cn("object-cover transition-opacity duration-500", ready && "opacity-0")}
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
                  "absolute rounded-full outline-none ring-offset-2 transition-shadow hover:ring-4 hover:ring-primary/30 focus-visible:ring-4 focus-visible:ring-ring",
                  !atEnd && "pointer-events-none"
                )}
                style={ctaBox}
              />
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-black/10">
              <div ref={barRef} className="h-full origin-left scale-x-0 bg-primary" />
            </div>
          </div>

          <div className="relative mx-4 mt-6 min-h-[7.5rem] md:absolute md:bottom-10 md:right-10 md:mx-0 md:mt-0 md:min-h-0 md:w-[26rem]">
            {CAPTIONS.map((c, i) => (
              <div
                key={c.title}
                aria-hidden={caption !== i}
                className={cn(
                  "absolute inset-x-0 top-0 text-center transition-all duration-500 md:bottom-0 md:top-auto md:rounded-2xl md:bg-white/85 md:p-6 md:text-left md:shadow-xl md:ring-1 md:ring-black/5 md:backdrop-blur-md",
                  caption === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
                )}
              >
                <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-[#0D4142]">
                  {String(i + 1).padStart(2, "0")} / {String(CAPTIONS.length).padStart(2, "0")}
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-[#0D4142] md:text-2xl">
                  {c.title}
                </p>
                <p className="mt-2 text-[#0D4142]/80">{c.body}</p>
                {i === 0 && (
                  <p className="mt-3 text-xs font-medium uppercase tracking-wider text-[#0D4142]/60">
                    Gulir untuk memutar
                  </p>
                )}
              </div>
            ))}
            {/* The CTA painted into the end card is too small to tap on phones. */}
            <div
              aria-hidden={!endCard}
              className={cn(
                "absolute inset-x-0 top-0 flex justify-center transition-all duration-500 md:hidden",
                endCard ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
              )}
            >
              <Button asChild size="lg" tabIndex={endCard ? 0 : -1}>
                <Link href="/auth/sign-up">Mulai gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Users who prefer reduced motion get a regular, user-started video instead. */}
      <section aria-labelledby="promo-title-static" className="hidden py-16 motion-reduce:block">
        <div className="mx-auto max-w-5xl px-4">
          <h2 id="promo-title-static" className="mb-6 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Lihat cara kerjanya
          </h2>
          <video
            controls
            muted
            playsInline
            preload="none"
            poster={`${BASE}/poster.webp`}
            className="aspect-video w-full rounded-2xl bg-[#EEEAD7] shadow-xl"
          >
            <source src={`${BASE}/qala-saku-promo.mp4`} type="video/mp4" />
          </video>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {CAPTIONS.map((c) => (
              <li key={c.title}>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
