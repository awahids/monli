"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Loading() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left",
          ease: "power1.inOut",
          duration: 1,
          repeat: -1,
          yoyo: true,
        },
      );
    }, barRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div
        ref={barRef}
        className="h-1 w-40 bg-primary rounded-full"
      />
    </div>
  );
}
