const ITEMS = [
  {
    title: "Catat manual",
    description: "Kamu yang pegang kendali. Tidak perlu menyambungkan rekening bank.",
  },
  {
    title: "Pribadi & aman",
    description: "Data hanya bisa dibuka pemilik akunnya dan tidak dibagikan ke pihak ketiga.",
  },
  {
    title: "Di mana saja",
    description: "Pantau dari HP maupun laptop, dan pasang seperti aplikasi.",
  },
  {
    title: "Terang & gelap",
    description: "Tampilan yang nyaman dipakai siang maupun malam.",
  },
];

/** Privacy and practicality, as a thin editorial strip. */
export function TrustSignals() {
  return (
    <section aria-label="Prinsip Qala Saku" className="border-y border-white/10">
      <ul className="mx-auto grid max-w-7xl divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {ITEMS.map((item, i) => (
          <li key={item.title} className="px-4 py-8 sm:px-6">
            <p className="font-editorial text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Prinsip {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-3 font-editorial text-lg">{item.title}</p>
            <p className="mt-1 font-editorial text-sm font-light leading-relaxed text-foreground/60">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
