"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if path is disabled (handling trailing slashes)
    const normalizedPath = pathname.endsWith('/') && pathname.length > 1 
      ? pathname.slice(0, -1) 
      : pathname;
      
    const disabledPaths = ["/", "/artists", "/top20"];
    
    if (disabledPaths.includes(normalizedPath)) {
      // FORCE RESET: Ensure standard scrolling is restored
      // Skip for home page ('/') as Hero component manages overflow: hidden
      if (normalizedPath !== '/') {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
      return;
    }

    // Dynamic Import to reduce initial bundle size
    Promise.all([
      import("lenis").then(m => m.default),
      import("gsap").then(m => m.default)
    ]).then(([Lenis, gsap]) => {
        const lenis = new Lenis({
          duration: 1.2, // Optimized for standard feel
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 2,
        });

        function update(time: number) {
          lenis.raf(time * 1000);
        }

        gsap.ticker.add(update);
        // Enable lag smoothing to prevent jumps during frame drops
        gsap.ticker.lagSmoothing(500, 33);

        // Cleanup function for this effect needs to be handled carefully
        // inside this promise chain or via a ref.
        // Since useEffect can't await, we need to handle cleanup via a ref or variable locally.
        
        // Attaching cleanup to the component instance isn't trivial here without refs.
        // Simplification for now: We assume SmoothScroll mounts once per page view.
        // But for correctness, let's use a cleanup callback.
        
        return () => {
          lenis.destroy();
          gsap.ticker.remove(update);
        };
    });
    
    // Note: The cleanup returned from useEffect runs synchronously. 
    // If the imports haven't finished, there's nothing to clean up yet.
    // If they finish after unmount, we need to handle that.
    
    let cleanupFunc: (() => void) | undefined;
    
    // Modification: Correct pattern for async effect
    let isMounted = true;
    
    const init = async () => {
         const [Lenis, gsap] = await Promise.all([
            import("lenis").then(m => m.default),
            import("gsap").then(m => m.default)
         ]);
         
         if (!isMounted) return;

         const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 2,
         });

         function update(time: number) {
            lenis.raf(time * 1000);
         }

         gsap.ticker.add(update);
         gsap.ticker.lagSmoothing(500, 33);

         cleanupFunc = () => {
            lenis.destroy();
            gsap.ticker.remove(update);
         };
    };

    init();

    return () => {
        isMounted = false;
        if (cleanupFunc) cleanupFunc();
    };

  }, [pathname]);

  return null;
}
