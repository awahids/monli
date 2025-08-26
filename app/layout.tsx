import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "monli - Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah",
  description:
    "monli adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat. Cerdas, mudah digunakan, dan dilengkapi grafik interaktif agar kamu bisa melihat gambaran keuangan secara utuh dan membuat keputusan finansial yang tepat.",
  keywords: [
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
    "aplikasi keuangan android",
    "aplikasi keuangan iOS",
    "monitor keuangan bulanan",
    "mengelola uang",
    "financial planner",
    "aplikasi keuangan gratis",
    "aplikasi keuangan terbaik",
    "catat pemasukan dan pengeluaran",
    "analisis keuangan pribadi",
    "aplikasi kontrol keuangan",
  ].join(", "),
  openGraph: {
    title: "monli - Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah",
    description:
      "monli adalah aplikasi pengelola keuangan yang dirancang untuk membantu pengguna mengatur dan memonitor kondisi finansial mereka secara efektif. Dengan antarmuka yang simpel namun kaya fitur, monli memudahkan proses pencatatan pemasukan maupun pengeluaran, sekaligus menyediakan laporan dan grafik analitis yang tajam untuk memahami kebiasaan belanja. Pengguna dapat menyusun anggaran, mengatur rencana tabungan, serta meninjau perkembangan keuangan secara real-time. monli cocok bagi individu maupun keluarga yang ingin meningkatkan literasi finansial dan meraih tujuan keuangan secara sistematis.",
    url: "https://monli.fun",
    type: "website",
    images: [
      {
        url: "/monli-og-image.png",
        width: 1200,
        height: 630,
        alt: "monli - Aplikasi Pengelola Keuangan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "monli - Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah",
    description:
      "monli adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat.",
    images: ["/monli-og-image.png"],
  },
  applicationName: "monli",
  generator: "Next.js",
  authors: [{ name: "monli Team" }],
  creator: "monli Team",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  robots: "index, follow",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="monli" />
        <meta
          name="google-site-verification"
          content="gs8ipaSQ05xaS9r1ScKArsPcBLNQGIDw8OONjrt0eBM"
        />
        <meta
          name="description"
          content="monli adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat. Cerdas, mudah digunakan, dan dilengkapi grafik interaktif agar kamu bisa melihat gambaran keuangan secara utuh dan membuat keputusan finansial yang tepat."
        />
        <meta
          name="keywords"
          content="aplikasi keuangan, aplikasi pengelola keuangan, aplikasi pencatat pengeluaran, aplikasi pengatur pengeluaran, budgeting app, pencatat keuangan harian, aplikasi anggaran keluarga, catatan keuangan pribadi, aplikasi tabungan, aplikasi manajemen keuangan, aplikasi keuangan android, aplikasi keuangan iOS, monitor keuangan bulanan, mengelola uang, financial planner, aplikasi keuangan gratis, aplikasi keuangan terbaik, catat pemasukan dan pengeluaran, analisis keuangan pribadi, aplikasi kontrol keuangan"
        />
        <meta
          property="og:title"
          content="monli - Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah"
        />
        <meta
          property="og:description"
          content="monli adalah aplikasi pengelola keuangan yang dirancang untuk membantu pengguna mengatur dan memonitor kondisi finansial mereka secara efektif. Dengan antarmuka yang simpel namun kaya fitur, monli memudahkan proses pencatatan pemasukan maupun pengeluaran, sekaligus menyediakan laporan dan grafik analitis yang tajam untuk memahami kebiasaan belanja. Pengguna dapat menyusun anggaran, mengatur rencana tabungan, serta meninjau perkembangan keuangan secara real-time. monli cocok bagi individu maupun keluarga yang ingin meningkatkan literasi finansial dan meraih tujuan keuangan secara sistematis."
        />
        <meta property="og:image" content="/monli-og-image.png" />
        <meta property="og:url" content="https://monli.fun" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="monli - Atur, lacak, dan wujudkan tujuan finansialmu dengan mudah"
        />
        <meta
          name="twitter:description"
          content="monli adalah aplikasi pengelola keuangan pribadi yang membantu kamu mencatat pengeluaran, memonitor pemasukan, menyusun anggaran, dan memantau tabungan dalam satu tempat."
        />
        <meta name="twitter:image" content="/monli-og-image.png" />
      </head>
      <body className={cn("bg-background text-foreground", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
