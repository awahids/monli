import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';
import { FEATURE_PAGES } from '@/components/marketing/feature-pages';

/** Public pages only; the app itself sits behind sign-in. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/kalkulator-zakat', ...FEATURE_PAGES.map((p) => `/fitur/${p.slug}`), '/auth/sign-up'].map((path) => ({
    url: `${BRAND.url}${path === '/' ? '' : path}`,
  }));
}
