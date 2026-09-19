"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Arm the hidden-until-revealed styles only now that this effect is running.
    // The CSS keys off this class, so if the bundle never loads the stories stay
    // visible instead of sitting at opacity:0 behind a section heading.
    const root = document.documentElement;

    // Reduced motion never hides anything, so the gate would only add a class
    // with no styles behind it.
    if (!isReduced) {
      // Mark what is already on screen as revealed *before* arming the gate.
      // Otherwise the hidden state applies for a frame and everything above the
      // fold — the lead story included — visibly blinks out and fades back in.
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.setAttribute("data-revealed", "");
        }
      });
      root.setAttribute("data-reveal-ready", "");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -4% 0px",
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll("[data-reveal]:not([data-revealed])");
      elements.forEach((el) => {
        if (isReduced) {
          el.setAttribute("data-revealed", "");
        } else {
          observer.observe(el);
        }
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      // Drop the gate on teardown so nothing can be left hidden by a stale class.
      root.removeAttribute("data-reveal-ready");
    };
  }, [pathname]);

  return null;
}
