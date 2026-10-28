'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type KantoMood = 'idle' | 'wave' | 'cheer';

const INK = '#0F172A';
const GOLD = 'hsl(var(--brand-gold))';
const BODY = 'hsl(var(--primary))';

/** A small four-pointed sparkle around Kanto when it cheers. */
function Sparkle({ x, y, r, delay }: { x: number; y: number; r: number; delay?: string }) {
  const s = r * 0.3;
  return (
    <path
      className="kanto-sparkle"
      style={delay ? { animationDelay: delay } : undefined}
      d={`M${x} ${y - r}L${x + s} ${y - s}L${x + r} ${y}L${x + s} ${y + s}L${x} ${y + r}L${x - s} ${y + s}L${x - r} ${y}L${x - s} ${y - s}Z`}
      fill={GOLD}
    />
  );
}

/**
 * "Kanto" (from kantong, a pocket), Qala Saku's own mascot: a pocket in the
 * accent colour, fastened with the gold diamond of the Qala mark, with a coin
 * peeking out. Idles (bob, blink, coin peek), waves, or cheers; the motion
 * lives in app/globals.css and stops when the device asks for reduced motion.
 */
export function Kanto({ mood = 'idle', className }: { mood?: KantoMood; className?: string }) {
  const happy = mood === 'cheer';
  return (
    <svg viewBox="0 0 120 120" data-mood={mood} className={cn('kanto overflow-visible', className)} aria-hidden>
      <ellipse className="kanto-shadow" cx="60" cy="114" rx="24" ry="3.5" fill="currentColor" opacity="0.12" />
      <Sparkle x={16} y={34} r={6} />
      <Sparkle x={104} y={22} r={5} delay="0.25s" />
      <Sparkle x={108} y={60} r={4} delay="0.5s" />
      <g className="kanto-body">
        {/* coin peeking out of the pocket, behind the flap */}
        <g className="kanto-coin">
          <circle cx="80" cy="27" r="10" fill={GOLD} stroke="#B7791F" strokeWidth="2" />
          <path d="M80 22.5v9" stroke="#B7791F" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        {/* arms, drawn hanging down; the pose classes rotate them at the shoulder */}
        <g className="kanto-arm-l">
          <path d="M28 72C20 76 18 84 20 90" fill="none" stroke={BODY} strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="91" r="5" fill={BODY} />
        </g>
        <g className="kanto-arm-r">
          <path d="M92 72C100 76 102 84 100 90" fill="none" stroke={BODY} strokeWidth="7" strokeLinecap="round" />
          <circle cx="100" cy="91" r="5" fill={BODY} />
        </g>
        {/* feet */}
        <ellipse cx="47" cy="107" rx="8" ry="4.5" fill={BODY} />
        <ellipse cx="73" cy="107" rx="8" ry="4.5" fill={BODY} />
        <ellipse cx="47" cy="107" rx="8" ry="4.5" fill="#000" opacity="0.15" />
        <ellipse cx="73" cy="107" rx="8" ry="4.5" fill="#000" opacity="0.15" />
        {/* pocket, with stitching */}
        <path d="M24 38H96V74C96 95 80 106 60 106S24 95 24 74Z" fill={BODY} />
        <path
          d="M31 45H89V74C89 90 76 99 60 99S31 90 31 74Z"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.45"
          strokeWidth="1.6"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
        {/* flap, a shade darker, fastened with the diamond */}
        <path d="M21 36Q21 29 29 29H91Q99 29 99 36L65 57Q60 60 55 57Z" fill={BODY} />
        <path d="M21 36Q21 29 29 29H91Q99 29 99 36L65 57Q60 60 55 57Z" fill="#000" opacity="0.14" />
        <path d="M60 47L69 56L60 65L51 56Z" fill={GOLD} />
        <path d="M57.5 51.5L60 49L62.5 51.5L60 54Z" fill="#fff" opacity="0.7" />
        {/* face */}
        {happy ? (
          <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
            <path d="M41 80Q47 72 53 80" />
            <path d="M67 80Q73 72 79 80" />
          </g>
        ) : (
          <g className="kanto-blink">
            <ellipse cx="47" cy="78" rx="5.5" ry="6.5" fill="#fff" />
            <ellipse cx="73" cy="78" rx="5.5" ry="6.5" fill="#fff" />
            <circle cx="48" cy="79" r="3.4" fill={INK} />
            <circle cx="74" cy="79" r="3.4" fill={INK} />
            <circle cx="49.2" cy="77.6" r="1.1" fill="#fff" />
            <circle cx="75.2" cy="77.6" r="1.1" fill="#fff" />
          </g>
        )}
        <ellipse cx="38" cy="88" rx="4.5" ry="2.8" fill="#FB7185" opacity="0.55" />
        <ellipse cx="82" cy="88" rx="4.5" ry="2.8" fill="#FB7185" opacity="0.55" />
        {happy ? (
          <path d="M54 88Q60 97 66 88Z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        ) : (
          <path d="M55 89Q60 93 65 89" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

/** Kanto waving hello when it appears, cheering when tapped. Decorative. */
export function KantoBuddy({ className }: { className?: string }) {
  const [mood, setMood] = useState<KantoMood>('wave');

  useEffect(() => {
    if (mood === 'idle') return;
    const timer = setTimeout(() => setMood('idle'), mood === 'wave' ? 2600 : 1800);
    return () => clearTimeout(timer);
  }, [mood]);

  return (
    <span aria-hidden className={cn('inline-block cursor-pointer select-none', className)} onClick={() => setMood('cheer')}>
      <Kanto mood={mood} className="h-full w-full" />
    </span>
  );
}
