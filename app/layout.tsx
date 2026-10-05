import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

// Qala family typography: Inter for body, Poppins for headings.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});

const title = `${BRAND.name} - Atur, lacak, dan wujudkan tujuan finansialmu`;

export const metadata: Metadata = {
  title,
  description: BRAND.description,
  keywords: [
    "qala saku",
    "qala",
    "monli",
    "aplikasi keuangan",
    "aplikasi pengelola keuangan",
    "aplikasi pencatat pengeluaran",
    "aplikasi pengatur pengeluaran",
    "budgeting app",
    "pencatat keuangan harian",
    "aplikasi anggaran keluarga",
    "catatan keuangan pribadi",
    "aplikasi tabungan",
    "aplikasi manajemen keuangan",
    "monitor keuangan bulanan",
    "mengelola uang",
    "aplikasi keuangan gratis",
    "catat pemasukan dan pengeluaran",
    "analisis keuangan pribadi",
  ],
  openGraph: {
    title,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.name,
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} - aplikasi keuangan pribadi, bagian dari keluarga Qala`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: BRAND.description,
    images: ["/og-image.png"],
  },
  applicationName: BRAND.name,
  generator: "Next.js",
  authors: [{ name: BRAND.family, url: BRAND.familyUrl }],
  creator: BRAND.family,
  publisher: BRAND.family,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
  verification: {
    google: "gs8ipaSQ05xaS9r1ScKArsPcBLNQGIDw8OONjrt0eBM",
  },
  // Next 13.5 still reads viewport and themeColor from metadata.
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.themeColor },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A17" },
  ],
  robots: "index, follow",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || BRAND.url),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(inter.variable, poppins.variable)}
    >
      <body className="bg-background font-sans text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
