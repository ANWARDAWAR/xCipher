"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SubcategoryStripProps {
  subcategories: { name: string; slug: string }[];
  parentSlug: string;
}

export default function SubcategoryStrip({ subcategories, parentSlug }: SubcategoryStripProps) {
  const searchParams = useSearchParams();
  const currentSub = searchParams.get("sub");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    
    const timeoutId = setTimeout(() => {
      const activeElement = scrollRef.current?.querySelector(".active-sub");
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [currentSub]);

  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="w-full border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md sticky top-14 z-30 mb-8 overflow-hidden">
      <div 
        ref={scrollRef}
        className="wrap flex items-center gap-2 overflow-x-auto py-3 px-4 sm:px-6 lg:px-8 no-scrollbar"
        style={{ scrollBehavior: "smooth", msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <Link
          href={`/category/${parentSlug}`}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            !currentSub 
              ? "bg-[var(--ink)] text-[var(--surface)] active-sub" 
              : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]"
          }`}
        >
          All
        </Link>
        {subcategories.map((sub) => {
          const isActive = currentSub === sub.slug;
          return (
            <Link
              key={sub.slug}
              href={`/category/${parentSlug}?sub=${sub.slug}`}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isActive 
                  ? "bg-[var(--ink)] text-[var(--surface)] active-sub" 
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {sub.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
