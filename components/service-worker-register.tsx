"use client";

import { useEffect } from "react";
// Imported here, in the root layout, so the install prompt is captured early.
import "@/lib/pwa";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Production only: dev chunk names are not hashed, so caching them would serve stale code.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // noop
      });
    }
  }, []);

  return null;
}
