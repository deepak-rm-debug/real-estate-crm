import { useEffect } from "react";

// every white rounded card inside <main>, except modal dialogs
const CARD = "main [class*='rounded-2xl'][class*='bg-white']:not([role='dialog'])";

export function useCardEffects() {
  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let raf = 0;
    let last: HTMLElement | null = null;

    const reset = (el: HTMLElement | null) => {
      if (el?.hasAttribute("data-tilt")) el.style.transform = "";
    };

    const onMove = (e: MouseEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>(CARD) ?? null;
      if (last && last !== card) reset(last);
      last = card;
      if (!card) return;

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        if (card.hasAttribute("data-tilt")) {
          const rx = (y / r.height - 0.5) * -9;
          const ry = (x / r.width - 0.5) * 9;
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      });
    };

    const onLeave = () => {
      reset(last);
      last = null;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);
}