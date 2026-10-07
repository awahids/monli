import Link from 'next/link';
import { BRAND, QALA_FAMILY } from '@/lib/brand';
import { QalaLogo } from '@/components/brand/qala-mark';
import { QalaFamilyLink } from '@/components/brand/qala-family';

const PRODUCT_LINKS = [
  { href: '#features', label: 'Fitur' },
  { href: '#how-it-works', label: 'Cara kerja' },
  { href: '#pricing', label: 'Harga' },
  { href: '#faq', label: 'Tanya jawab' },
];

const ACCOUNT_LINKS = [
  { href: '/auth/sign-up', label: 'Daftar gratis' },
  { href: '/auth/sign-in', label: 'Masuk' },
];

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-editorial text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
      {children}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 font-editorial text-sm">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <QalaLogo />
          <p className="max-w-xs font-light leading-relaxed text-foreground/60">{BRAND.tagline}.</p>
          <p className="text-xs text-muted-foreground">Sebelumnya bernama {BRAND.formerName}.</p>
        </div>

        <nav aria-label="Produk" className="space-y-4">
          <Heading>Produk</Heading>
          <ul className="space-y-2.5 text-foreground/70">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Akun" className="space-y-4">
          <Heading>Akun</Heading>
          <ul className="space-y-2.5 text-foreground/70">
            {ACCOUNT_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={`Keluarga ${BRAND.family}`} className="space-y-4">
          <Heading>Keluarga {BRAND.family}</Heading>
          <ul className="space-y-2.5 text-foreground/70">
            {QALA_FAMILY.map((product) => (
              <li key={product.url}>
                <a
                  href={product.url}
                  className="hover:text-foreground"
                  {...(product.name === BRAND.name
                    ? { 'aria-current': 'page' as const }
                    : { target: '_blank', rel: 'noreferrer' })}
                >
                  {product.name}
                  <span className="block text-xs text-muted-foreground">{product.description}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={BRAND.familyUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
                qala.digital
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {BRAND.name}
          </p>
          <p className="uppercase tracking-[0.25em]">Atur · Catat · Pahami</p>
          <QalaFamilyLink />
        </div>
      </div>
    </footer>
  );
}
