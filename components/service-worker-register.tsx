"use client";

import { useEffect } from "react";
// Imported here, in the root layout, so the install prompt is captured early.
import "@/lib/pwa";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // noop
      });
    }
  }, []);

  return null;
}
