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

type Plan = "FREE" | "PRO";

export default function ZakatCalculator({
  plan,
  canUseLivePrice: initialCanUseLivePrice,
}: {
  plan: Plan;
  canUseLivePrice: boolean;
}) {
  const [idrPerGram, setIdrPerGram] = useState<number>(0);
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
          "Kuota harga live 1x per tahun telah digunakan. Silakan input manual.",
        );
        setCanUseLive(false);
        return;
      }
      if (!r.ok) {
        alert("Failed to fetch live price, please try again.");
        return;
      }
      const d = await r.json();
      setIdrPerGram(d.idrPerGram);
      setTs(d.tsJakarta ?? null);
      setCanUseLive(false);
    } catch {
      alert("Network error. Please input price manually.");
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
          <h1 className="text-2xl font-semibold">Kalkulator Zakat Maal</h1>
          <p className="text-sm text-muted-foreground">
            Hitung nisab & zakat 2,5% secara cepat. (Halaman ini memerlukan
            login)
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-2 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={resetAll}>Reset</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dahsboard</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Price */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Harga emas per gram (IDR)
          </label>
          {plan === "PRO" ? (
            canUseLive ? (
              <button
                onClick={useLivePrice}
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              >
                Gunakan harga live
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Kuota harga live telah digunakan tahun ini
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              Live price tersedia untuk PRO
            </span>
          )}
        </div>
        <input
          type="number"
          inputMode="numeric"
          className="w-full rounded-md border p-2"
          value={Number.isFinite(idrPerGram) ? idrPerGram : 0}
          onChange={(e) => setIdrPerGram(parseFloat(e.target.value) || 0)}
          placeholder="Isi manual, contoh: 1750000"
        />
        {ts && (
          <p className="text-xs text-muted-foreground">Diperbarui: {ts}</p>
        )}
      </section>

      {/* Standard */}
      <section className="space-y-2">
        <label className="text-sm font-medium">Standar nisab</label>
        <div className="flex gap-3">
          <button
            className={`rounded-md border px-3 py-1 text-sm ${standard === "gold" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setStandard("gold")}
          >
            Emas (85g)
          </button>
          <button
            className={`rounded-md border px-3 py-1 text-sm ${standard === "silver" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setStandard("silver")}
          >
            Perak (595g)
          </button>
        </div>
      </section>

      {/* Inputs: assets/liabilities */}
      <section className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Aset likuid (Kas/Bank/E-wallet)</label>
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
          <label className="text-sm">Emas/Perak (nilai IDR)</label>
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
          <label className="text-sm">Piutang tertagih</label>
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
          <label className="text-sm">Persediaan dagang</label>
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
          <label className="text-sm">Utang jangka pendek (≤ 1 tahun)</label>
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
          <span>Harta Kena Zakat</span>
          <span>{toIDR(zakatable)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Status</span>
          <span>{obligatory ? "Wajib" : "Belum wajib"}</span>
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span>Zakat (2,5%)</span>
          <span>{toIDR(amount)}</span>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">
        Kalkulator ini bersifat panduan. Untuk penetapan akhir, silakan
        konsultasi dengan otoritas keagamaan setempat.
      </p>
    </main>
  );
}
