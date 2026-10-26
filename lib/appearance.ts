/**
 * Accent colour (every plan) and theme (PRO), remembered on this device and
 * applied as data attributes on <html>; the colours live in app/globals.css.
 */

export const ACCENTS = [
  { id: 'teal', name: ['Teal', 'Teal'], swatch: '#0E8079' },
  { id: 'blue', name: ['Biru', 'Blue'], swatch: '#1550C2' },
  { id: 'violet', name: ['Ungu', 'Violet'], swatch: '#6D3FC0' },
  { id: 'rose', name: ['Merah muda', 'Rose'], swatch: '#C42260' },
  { id: 'orange', name: ['Oranye', 'Orange'], swatch: '#BD5510' },
  { id: 'green', name: ['Hijau', 'Green'], swatch: '#178052' },
] as const;

/**
 * `ownColors` themes bring their own palette, pattern, font and artwork
 * (components/appearance/theme-art.tsx), so the accent colour does not apply.
 */
export const THEMES = [
  { id: 'classic', name: ['Klasik', 'Classic'], description: ['Krem hangat, bawaan Qala Saku', 'Warm cream, the Qala Saku default'], pro: false, ownColors: false },
  { id: 'minimal', name: ['Minimal', 'Minimal'], description: ['Putih bersih, sudut tegas, tanpa bayangan', 'Clean white, crisp corners, no shadows'], pro: true, ownColors: false },
  { id: 'soft', name: ['Lembut', 'Soft'], description: ['Latar diwarnai aksenmu, sudut membulat', 'Background tinted with your accent, rounded corners'], pro: true, ownColors: false },
  { id: 'bold', name: ['Kontras', 'Bold'], description: ['Hitam-putih tajam, hitam pekat di mode gelap', 'Sharp black and white, true black in dark mode'], pro: true, ownColors: false },
  { id: 'islamic', name: ['Islami', 'Islamic'], description: ['Hijau zamrud & emas, motif geometris, salam', 'Emerald & gold, geometric pattern, salam greeting'], pro: true, ownColors: true },
  { id: 'cartoon', name: ['Kartun', 'Cartoon'], description: ['Ceria, garis tebal, ditemani maskot Celengan', 'Playful, bold outlines, with the Piggy mascot'], pro: true, ownColors: true },
] as const;

export type Accent = (typeof ACCENTS)[number]['id'];
export type Theme = (typeof THEMES)[number]['id'];

export const ACCENT_KEY = 'saku_accent';
export const THEME_KEY = 'saku_theme';
export const DEFAULT_ACCENT: Accent = 'teal';
export const DEFAULT_THEME: Theme = 'classic';

export function parseAccent(value: string | null | undefined): Accent {
  return ACCENTS.some((a) => a.id === value) ? (value as Accent) : DEFAULT_ACCENT;
}

/** The theme to show: PRO themes fall back to Klasik once the plan is not PRO. */
export function effectiveTheme(value: string | null | undefined, isPro: boolean): Theme {
  const theme = THEMES.find((t) => t.id === value);
  if (!theme || (theme.pro && !isPro)) return DEFAULT_THEME;
  return theme.id;
}

/** Whether the theme ignores the accent colour because it has its own. */
export function hasOwnColors(theme: Theme): boolean {
  return THEMES.find((t) => t.id === theme)?.ownColors ?? false;
}

/** Sets the attributes on <html>; the defaults remove them so :root applies. */
export function applyAppearance(accent: Accent, theme: Theme, root: HTMLElement = document.documentElement) {
  if (accent === DEFAULT_ACCENT) delete root.dataset.accent;
  else root.dataset.accent = accent;
  if (theme === DEFAULT_THEME) delete root.dataset.style;
  else root.dataset.style = theme;
}

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/**
 * Runs in <head> before the first paint so the chosen colours never flash.
 * The plan is not known yet; the dashboard drops a PRO theme for FREE users.
 */
export const APPEARANCE_BOOT_SCRIPT = `try{var d=document.documentElement,a=localStorage.getItem("${ACCENT_KEY}"),t=localStorage.getItem("${THEME_KEY}");if(a&&a!=="${DEFAULT_ACCENT}")d.dataset.accent=a;if(t&&t!=="${DEFAULT_THEME}")d.dataset.style=t}catch(e){}`;
