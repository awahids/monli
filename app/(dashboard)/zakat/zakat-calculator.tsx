"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
  calcNisab,
  calcZakat,
  toIDR,
} from "@/lib/zakat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useT } from '@/lib/i18n';

type Plan = "FREE" | "PRO";

export default function ZakatCalculator({
  plan,
  canUseLivePrice: initialCanUseLivePrice,
}: {
  plan: Plan;
  canUseLivePrice: boolean;
}) {
  const [idrPerGram, setIdrPerGram] = useState<number>(0);
  const { t } = useT();
  const [ts, setTs] = useState<string | null>(null);
  const [standard, setStandard] = useState<"gold" | "silver">("gold");
  const [assets, setAssets] = useState({
    cash: 0,
    metals: 0,
    receivables: 0,
    inventory: 0,
  });
  const [liabs, setLiabs] = useState({ shortTerm: 0 });
  const [canUseLive, setCanUseLive] = useState(initialCanUseLivePrice);
  const grams = standard === "gold" ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS;

  const nisab = calcNisab(idrPerGram, grams);
  const zakatable = Math.max(
    0,
    (assets.cash || 0) +
      (assets.metals || 0) +
      (assets.receivables || 0) +
      (assets.inventory || 0) -
      (liabs.shortTerm || 0),
  );
  const { obligatory, amount } = calcZakat(zakatable, nisab);

  async function useLivePrice() {
    try {
      const r = await fetch("/api/metal/gold", { cache: "no-store" });
      if (r.status === 429) {
        alert(
          t(
            "Kuota harga live 1x per tahun telah digunakan. Silakan input manual.",
            "The once-a-year live price has been used. Please enter it manually.",
          ),
        );
        setCanUseLive(false);
        return;
      }
      if (!r.ok) {
        alert(t("Gagal mengambil harga emas terkini, coba lagi.", "Could not get the current gold price, try again."));
        return;
      }
      const d = await r.json();
      setIdrPerGram(d.idrPerGram);
      setTs(d.tsJakarta ?? null);
      setCanUseLive(false);
    } catch {
      alert(t("Koneksi bermasalah. Silakan isi harga secara manual.", "Connection problem. Please enter the price manually."));
    }
  }

  function resetAll() {
    setIdrPerGram(0);
    setTs(null);
    setStandard("gold");
    setAssets({ cash: 0, metals: 0, receivables: 0, inventory: 0 });
    setLiabs({ shortTerm: 0 });
  }

  return (
    <main className="mx-auto max-w-xl p-4 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("Kalkulator Zakat Maal", "Zakat al-Maal calculator")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Hitung nisab & zakat 2,5% secara cepat.", "Work out the nisab and 2.5% zakat quickly.")}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-2 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={resetAll}>{t("Reset", "Reset")}</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">{t("Beranda", "Home")}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Price */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {t("Harga emas per gram (IDR)", "Gold price per gram (IDR)")}
          </label>
          {plan === "PRO" ? (
            canUseLive ? (
              <button
                onClick={useLivePrice}
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              >
                {t("Gunakan harga live", "Use live price")}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("Kuota harga live telah digunakan tahun ini", "Live price already used this year")}
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("Harga live tersedia untuk PRO", "Live price is available on PRO")}
            </span>
          )}
        </div>
        <input
          type="number"
          inputMode="numeric"
          className="w-full rounded-md border p-2"
          value={Number.isFinite(idrPerGram) ? idrPerGram : 0}
          onChange={(e) => setIdrPerGram(parseFloat(e.target.value) || 0)}
          placeholder={t("Isi manual, contoh: 1750000", "Enter manually, e.g. 1750000")}
        />
        {ts && (
          <p className="text-xs text-muted-foreground">{t("Diperbarui", "Updated")}: {ts}</p>
        )}
      </section>

      {/* Standard */}
      <section className="space-y-2">
        <label className="text-sm font-medium">{t("Standar nisab", "Nisab standard")}</label>
        <div className="flex gap-3">
          <button
            className={`rounded-md border px-3 py-1 text-sm ${standard === "gold" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setStandard("gold")}
          >
            {t("Emas (85g)", "Gold (85g)")}
          </button>
          <button
            className={`rounded-md border px-3 py-1 text-sm ${standard === "silver" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setStandard("silver")}
          >
            {t("Perak (595g)", "Silver (595g)")}
          </button>
        </div>
      </section>

      {/* Inputs: assets/liabilities */}
      <section className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm">{t("Aset likuid (Kas/Bank/E-wallet)", "Liquid assets (cash/bank/e-wallet)")}</label>
          <input
            type="number"
            className="rounded-md border p-2"
            value={assets.cash}
            onChange={(e) =>
              setAssets((a) => ({
                ...a,
                cash: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">{t("Emas/Perak (nilai IDR)", "Gold/silver (IDR value)")}</label>
          <input
            type="number"
            className="rounded-md border p-2"
            value={assets.metals}
            onChange={(e) =>
              setAssets((a) => ({
                ...a,
                metals: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">{t("Piutang tertagih", "Collectible receivables")}</label>
          <input
            type="number"
            className="rounded-md border p-2"
            value={assets.receivables}
            onChange={(e) =>
              setAssets((a) => ({
                ...a,
                receivables: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">{t("Persediaan dagang", "Trade inventory")}</label>
          <input
            type="number"
            className="rounded-md border p-2"
            value={assets.inventory}
            onChange={(e) =>
              setAssets((a) => ({
                ...a,
                inventory: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">{t("Utang jangka pendek (≤ 1 tahun)", "Short-term debts (≤ 1 year)")}</label>
          <input
            type="number"
            className="rounded-md border p-2"
            value={liabs.shortTerm}
            onChange={(e) =>
              setLiabs({ shortTerm: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </section>

      {/* Results */}
      <section className="rounded-lg border p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Nisab</span>
          <span>{toIDR(nisab)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t("Harta Kena Zakat", "Zakatable wealth")}</span>
          <span>{toIDR(zakatable)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Status</span>
          <span>{obligatory ? t("Wajib", "Due") : t("Belum wajib", "Not due yet")}</span>
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span>Zakat (2,5%)</span>
          <span>{toIDR(amount)}</span>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">
        {t(
          "Kalkulator ini bersifat panduan. Untuk penetapan akhir, silakan konsultasi dengan otoritas keagamaan setempat.",
          "This calculator is a guide. For a final ruling, please consult your local religious authority.",
        )}
      </p>
    </main>
  );
}
