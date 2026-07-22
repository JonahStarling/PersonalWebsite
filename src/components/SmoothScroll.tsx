"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { scroll } from "@/lib/scrollStore";

/**
 * Wraps the app in Lenis smooth scrolling and publishes normalized scroll
 * progress into the shared `scroll` store, which the 3D CameraRig reads each
 * frame. Respects prefers-reduced-motion by disabling smoothing entirely.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Publish pointer position for subtle camera parallax.
    const onPointer = (e: PointerEvent) => {
      scroll.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      scroll.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    if (reduce) {
      // No smooth scroll; still track progress from native scroll for the
      // (frozen) camera position mapping.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll.progress = max > 0 ? window.scrollY / max : 0;
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3.2), // gentle ease-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", (e: { progress: number }) => {
      scroll.progress = e.progress;
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <>{children}</>;
}
