"use client";

import { useEffect, useState } from "react";
import { QalaMark } from "@/components/brand/qala-mark";

/**
 * The animated logo while the app opens (the same one public/launch.html shows
 * first), until the signed-in user is loaded. Rendered on the server so it
 * paints before the skeletons; client navigations keep the shell, so it only
 * shows on a full load.
 */
export function AppSplash({ ready }: { ready: boolean }) {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // A short beat so the animation reads as a splash, not a flicker.
    const timer = setTimeout(() => setLeaving(true), 300);
    return () => clearTimeout(timer);
  }, [ready]);

  if (gone) return null;
  return (
    <div
      role="status"
      aria-label="Membuka Qala Saku"
      data-testid="app-splash"
      className={`app-splash fixed inset-0 z-[90] grid place-items-center bg-background${leaving ? " app-splash-leaving" : ""}`}
      onAnimationEnd={(e) => e.target === e.currentTarget && setGone(true)}
    >
      <QalaMark animated className="h-auto w-28 overflow-visible" />
    </div>
  );
}
