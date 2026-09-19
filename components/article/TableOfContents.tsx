"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ containerSelector = ".prose" }: { containerSelector?: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Give time for content to render, especially in admin preview
    const timeoutId = setTimeout(() => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const elements = Array.from(container.querySelectorAll("h2, h3"));
      
      const newItems = elements.map((el) => {
        // If an id doesn't exist (e.g. older articles), assign one dynamically on the client
        if (!el.id) {
          el.id = el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `heading-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        return {
          id: el.id,
          text: el.textContent || "",
          level: Number(el.tagName.charAt(1)), // 2 or 3
        };
      }).filter(item => item.text.trim().length > 0);

      setItems(newItems);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [containerSelector]);

  useEffect(() => {
    if (items.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Find all intersecting entries
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      
      if (visibleEntries.length > 0) {
        // Sort by how close they are to the top of the viewport
        visibleEntries.sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        
        // Pick the top-most visible heading
        setActiveId(visibleEntries[0].target.id);
      }
    };

    // Root margin creates a detection window at the top of the screen
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-80px 0px -80% 0px",
      threshold: [0, 1]
    });

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      // Account for fixed header height
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[var(--surface-2)] border border-[var(--line)] p-5 rounded-sm shadow-sm">
      <h3 className="font-[family:var(--f-display)] text-[11px] font-bold uppercase tracking-widest text-[var(--ink)] mb-4 border-b border-[var(--line)] pb-3">
        In this article
      </h3>
      <nav className="flex flex-col">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block text-xs py-1 transition-colors truncate border-l-2 ${
                item.level === 3 ? "ml-3" : ""
              } ${
                isActive 
                  ? "border-[var(--accent)] text-[var(--ink)] pl-3 -ml-4 bg-[var(--surface)] font-medium" 
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              title={item.text}
            >
              {item.text}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
