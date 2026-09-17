"use client";

import { useEffect, useState } from "react";

export default function ProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    document.body.classList.add("is-article");

    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const progress = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("is-article");
    };
  }, []);

  return (
    <div
      id="pbar"
      aria-hidden="true"
      style={{
        display: "block",
        transform: `scaleX(${scrollProgress})`,
      }}
    />
  );
}
