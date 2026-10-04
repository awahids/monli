import Link from 'next/link';
import { BRAND, QALA_FAMILY } from '@/lib/brand';
import { QalaLogo } from '@/components/brand/qala-mark';
import { QalaFamilyLink } from '@/components/brand/qala-family';

export function Footer() {
  return (
    <footer className="border-t py-10 text-sm">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <QalaLogo />
          <p className="max-w-sm text-muted-foreground">{BRAND.tagline}.</p>
          <p className="text-xs text-muted-foreground">
            Sebelumnya bernama {BRAND.formerName}.
          </p>
        </div>

        <nav aria-label="Keluarga Qala" className="space-y-2">
          <p className="font-semibold">Keluarga {BRAND.family}</p>
          <ul className="space-y-1.5 text-muted-foreground">
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
                  <span className="text-xs"> · {product.description}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={BRAND.familyUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                qala.digital
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Informasi" className="space-y-2">
          <p className="font-semibold">Informasi</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
            <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="#" className="hover:text-foreground">Status</Link></li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t px-4 pt-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {BRAND.name}
        </p>
        <QalaFamilyLink />
      </div>
    </footer>
  );
}
