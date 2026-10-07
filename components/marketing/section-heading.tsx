import { cn } from "@/lib/utils";

interface Props {
  index: string;
  kicker: string;
  title: string;
  description?: string;
  id?: string;
  className?: string;
}

/** Editorial section opener: "02 — Fitur", a large title, and a short note on the right. */
export function SectionHeading({ index, kicker, title, description, id, className }: Props) {
  return (
    <div className={cn("grid gap-6 border-t border-white/10 pt-6 md:grid-cols-[1fr_auto] md:items-end", className)}>
      <div className="max-w-3xl">
        <p className="font-editorial text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          <span className="text-primary">{index}</span> — {kicker}
        </p>
        <h2
          id={id}
          className="mt-4 font-editorial text-3xl font-normal leading-[1.08] tracking-[-0.015em] sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-xs font-editorial text-sm font-light leading-relaxed text-foreground/65 md:text-right">
          {description}
        </p>
      )}
    </div>
  );
}
