"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const pathname = usePathname();
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Disable Lenis on the homepage ("/") and app-like pages
    const disabledPaths = ["/", "/artists", "/top20"];
    if (disabledPaths.includes(pathname)) {
      // FORCE RESET: Ensure standard scrolling is restored
      // Skip for home page ('/') as Hero component manages overflow: hidden
      if (pathname !== '/') {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
      return;
    }

    const lenis = new Lenis({
      duration: 2.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard ease
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      rafId.current = requestAnimationFrame(raf);
    }

    rafId.current = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [pathname]);

  return null;
}
